import { Injectable, Logger } from '@nestjs/common';
import { Model, Connection } from 'mongoose';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { IQuestion } from './interfaces/answers.interface';
import { IUser } from './interfaces/users.interface';
import {
  IQuiz,
  StatusType,
  IProducts,
  IProductTypes,
  ISpinWin,
  SpinWinType,
} from 'knowin/common';
import * as moment from 'moment';
import * as _ from 'lodash';
import { AppGateway } from './app.gateway';
import { GameConfig, IPowerupInfo } from './utils/game-config.util';
import { NotificationService } from './notification/notification.service';

export interface IServer {
  serverId: string;
}

export interface IQuizMeta {
  starttime: Date;
  quizid: string;
}

@Injectable()
export class AppService {
  private logger = new Logger('Game Service');
  constructor(
    @InjectModel('Quiz') private readonly quizModel: Model<IQuiz>,
    @InjectModel('Users') private readonly userModel: Model<IUser>,
    @InjectModel('Products') private readonly productsModel: Model<IProducts>,
    @InjectModel('Question') private readonly questionModel: Model<IQuestion>,
    @InjectModel('Spinwin') private readonly spinWinModel: Model<ISpinWin>,
    @InjectConnection() private readonly connection: Connection,
    private readonly socket: AppGateway,
    private readonly notification: NotificationService,
  ) {}

  async startGame(quiz: IQuizMeta) {
    Logger.log(`Recived a game to start Quiz ID ==> ${quiz.quizid}`);
    // Shedule it for the start.
    const now = moment.utc();
    const quizTime = moment.utc(quiz.starttime);

    const timeLeftInMs = moment.duration(quizTime.diff(now)).asMilliseconds();

    // Start game on exact time
    setTimeout(() => {
      this.startGameSeq(quiz.quizid);
    }, timeLeftInMs);

    // Send Notification before 2 min or immediately if start time in in next 2 nin
    setTimeout(() => {
      this.sendGameStartNotification(quiz.quizid);
    }, timeLeftInMs - 120000);

    await this.quizModel.updateOne(
      {
        quizid: quiz.quizid,
      },
      {
        $set: {
          status: StatusType.queued,
        },
      },
    );
  }

  async startGameSeq(quizid: string) {
    // Keep track of the success of each step
    let questionList: IQuestion[];
    let usersList: IUser[];
    let quiz: IQuiz;
    let powerupInfo: IPowerupInfo[];

    try {
      quiz = await this.updateAndGetQuiz(quizid, StatusType.running);
      if (!quiz) throw new Error();
      this.logger.log(`Fetched Quiz data`);
    } catch (error) {
      this.logger.error(`Failed to fetch quiz data for the quiz id ${quizid}`);
      return;
    }

    try {
      const quizIds = quiz.questionlist;
      const _questionList = await this.getQuestionData(quizIds);
      // Sorting the list in right order
      questionList = quiz.questionlist.map(id => {
        return _questionList.find(({ questionid }) => questionid === id);
      });
      this.logger.log(`Fetched Question Data`);
      //this.logger.log(questionList);
    } catch (error) {
      this.logger.error(`Failed to fetch questions for the quiz id ${quizid}`);
      return;
    }

    // Get users list
    try {
      const usersIds = quiz.joinedusers;
      usersList = await this.getUsersData(usersIds);
      this.logger.log(`Fetched Users Data`);
    } catch (error) {
      this.logger.error(`Failed to fetch users for the quiz id ${quizid}`);
      return;
    }

    // Fetch powerup's info
    try {
      powerupInfo = await this.getProductsInfo(quiz.joinedusers);
      this.logger.log(`Fetched Users powerup Data`);
    } catch (error) {
      this.logger.log(`Failed to fetch powerup data for the quiz id ${quizid}`);
      return;
    }

    // Step 2 Starts: ----------------------------------------------------
    // Seting up the ds for the quiz to store in redis

    // Misc don't start the game if the required no of users are not more then 25% of the room size
    const twentyFivePerOfRoomSize = 0.25 * quiz.roomsize;
    const fiftyPerOfRoomSize = 0.5 * quiz.roomsize;

    Logger.log(
      `${twentyFivePerOfRoomSize} Should be filled currently it's ${usersList.length}`,
    );

    if (usersList.length < twentyFivePerOfRoomSize) {
      Logger.log(
        `Game is being cancled.. Filled Size is ${usersList.length} and Required Min Size is ${twentyFivePerOfRoomSize}`,
      );
      this.startGameCancleSeq(quizid);
      return;
    }

    if (usersList.length < fiftyPerOfRoomSize) {
      Logger.log(
        `Game is filled with less then 50% of the total room size! game entryfee will be reduced to half`,
      );
      quiz = await this.quizModel.findOneAndUpdate(
        { quizid: quiz.quizid },
        {
          $set: {
            winningprice: quiz.winningprice / 2,
          },
        },
        {
          new: true,
        },
      );

      try {
        const fcmTokens = usersList.map(user => ({
          fcm_token: user.fcm_token,
          locale: user.locale,
        }));
        const validfcmTokens = fcmTokens.filter(
          ({ fcm_token }) => String(fcm_token) !== '',
        );
        if (validfcmTokens.length > 0) {
          this.notification.send(fcmTokens, {
            type: 'GAME_PRIZE_REDUCED',
            quizid,
          });
        }
      } catch (error) {
        Logger.error(error.toString());
      }
    }

    // Here the game is started so we can update the spin win data here

    // Check the type of quiz if a vip then inc the vip type else regular
    let quizType = SpinWinType.regular;

    if (quiz.entryfee > 0) {
      quizType = SpinWinType.vip;
    }

    await this.spinWinModel.bulkWrite(
      quiz.joinedusers.map((userid: string) => {
        return {
          updateOne: {
            filter: {
              userid,
              type: quizType,
            },
            update: {
              $inc: {
                gamePlayed: 1,
              },
              $setOnInsert: {
                userid,
                type: quizType,
              },
            },
            upsert: true,
          },
        };
      }),
    );

    Logger.log(`Init GameConfig`);
    Logger.log(`Meta Data`);

    const gameConfig = new GameConfig(
      this.connection,
      quiz,
      questionList,
      usersList,
      powerupInfo,
    );
    // Step 2 Ends: -------------------------------------------------------

    // Step 3 Start: -----------------------------------------------------
    this.socket.startANewRoom(gameConfig);
    // Step 3 Ends: -----------------------------------------------------
  }

  async getProductsInfo(userids: string[]): Promise<any[]> {
    const res = await this.productsModel.aggregate([
      {
        $match: {
          userid: {
            $in: userids,
          },
        },
      },
      {
        $group: {
          _id: '$userid',
          products: {
            $push: '$productid',
          },
          qty: {
            $push: '$count',
          },
        },
      },
      {
        $addFields: {
          userid: '$_id',
        },
      },
      {
        $project: {
          _id: 0,
        },
      },
    ]);

    // Some clean up
    const newArr = res.map(item => {
      const { userid, products: _products, qty } = item;
      const products = {};
      _products.forEach((key: string, i: number) => {
        products[key] = qty[i];
      });

      return {
        userid,
        products,
      };
    });

    return newArr;
  }

  async updateAndGetQuiz(quizid: string, gameStatus: StatusType): Promise<any> {
    return this.quizModel.findOneAndUpdate(
      {
        quizid,
      },
      {
        $set: {
          status: gameStatus,
        },
      },
      {
        new: true,
      },
    );
  }

  async getQuestionData(ids: string[]): Promise<IQuestion[]> {
    return this.questionModel.find({
      questionid: {
        $in: ids,
      },
    });
  }

  async getUsersData(ids: string[]): Promise<IUser[]> {
    return this.userModel.find({
      userid: {
        $in: ids,
      },
    });
  }

  async getQuiz(quizid: string): Promise<any> {
    return this.quizModel.findOne({
      quizid,
    });
  }

  async sendGameStartNotification(quizid: string) {
    this.logger.log(`Game Start Notification sending from quizid ${quizid}`);
    const quizInfo = await this.getQuiz(quizid);
    const usersList = await this.getUsersData(quizInfo.joinedusers);

    try {
      const fcmTokens = usersList.map(user => ({
        fcm_token: user.fcm_token,
        locale: user.locale,
      }));
      const validfcmTokens = fcmTokens.filter(
        ({ fcm_token }) => String(fcm_token) !== '',
      );
      if (validfcmTokens.length > 0) {
        this.notification.send(fcmTokens, {
          type: 'GAME_START',
          quizid,
        });
      }
    } catch (error) {
      Logger.error(error.toString());
    }
  }

  async refundKeys(userIds: string[], keys: number) {
    Logger.log(`Rufunding..`);
    Logger.log(`Userlist`);
    Logger.log(userIds);
    Logger.log(`Keys count`);
    Logger.log(keys);
    Logger.log(IProductTypes.key);
    await this.productsModel.updateMany(
      {
        userid: {
          $in: userIds,
        },
        productid: IProductTypes.key,
      },
      {
        $inc: {
          count: keys,
        },
      },
    );
  }

  async startGameCancleSeq(quizid: string) {
    // Get quiz and update the status to cancelled
    const quizInfo: IQuiz = await this.updateAndGetQuiz(
      quizid,
      StatusType.cancelled,
    );
    const usersList = await this.getUsersData(quizInfo.joinedusers);

    try {
      await this.refundKeys(quizInfo.joinedusers, quizInfo.entryfee);
      Logger.log(`Refunded keys...`);
    } catch (error) {
      Logger.log(`Refunded keys failed for quiz id ${quizInfo.quizid}`);
      Logger.error(error.toString());
    }

    try {
      const fcmTokens = usersList.map(user => ({
        fcm_token: user.fcm_token,
        locale: user.locale,
      }));
      const validfcmTokens = fcmTokens.filter(
        ({ fcm_token }) => String(fcm_token) !== '',
      );
      if (validfcmTokens.length > 0) {
        this.notification.send(fcmTokens, {
          type: 'GAME_CANCELLED',
          quizid,
          context: {
            category: quizInfo.category,
          },
        });
      }
    } catch (error) {
      Logger.error(error.toString());
    }
  }
}
