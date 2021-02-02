import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { IQuiz, IProductTypes, IPlayedGame } from 'knowin/common';
import { AddQuizDto } from './dto/add-quiz.dto';
import * as moment from 'moment';
import * as _ from 'lodash';
import uuid = require('uuid');
import { IProducts } from 'knowin/common';
import { NotificationService } from '../notification/notification.service';

import * as AWS from 'aws-sdk';
import { StatusType } from 'knowin/common';
import { getCode, getCodeN } from 'knowin/status-codes';
AWS.config.update({ region: 'us-east-1' });

@Injectable()
export class QuizService {
  private readonly logger = new Logger('QuizService');
  private readonly s3 = new AWS.S3({
    apiVersion: '2006-03-01',
  });

  constructor(
    @InjectConnection() private conn: Connection,
    @InjectModel('Quiz') private readonly quizModel: Model<IQuiz>,
    @InjectModel('Products') private readonly productsModel: Model<IProducts>,
    @InjectModel('PlayedGame')
    private readonly playedGameModel: Model<IPlayedGame>,
    private readonly notificationService: NotificationService,
  ) {}

  /*
    Add Quiz
   */
  async addQuiz(addQuizDto: AddQuizDto, file: any, fileType: any) {
    const id = uuid.v4();
    let uri = '';

    if (fileType === 'new') {
      const uploadParams = {
        Bucket: 'knowin/quiz-banner',
        Key: id,
        Body: file.buffer,
        ACL: 'public-read',
      };
      const result = await this.uploadFile(uploadParams);
      uri = result.Location;
    } else {
      uri = addQuizDto.file_url;
    }
    // Upload login here

    const data = {
      ...addQuizDto,
      quizid: id,
      banner: uri,
    };
    this.logger.log(`Added new quiz with id ${id}`);
    const newDoc = new this.quizModel(data);

    //if (process.env.KNOWIN_ENV === 'production') {
    //await this.sendHook(
    //data.entryfee,
    //data.roomsize,
    //data.starttime,
    //data.reward_type,
    //data.category,
    //data.winningprice,
    //data.banner,
    //);
    //}
    return newDoc.save();
  }

  async uploadFile(config: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.s3.upload(config, (err: any, data: any) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  }

  async getAllActiveQuiz(page: number, limit: number, onlyNew: boolean) {
    let count: number;
    let docs: any[];

    if (onlyNew) {
      const GAME_TIME = 30 + 20 * 10 + (18 + 9);
      const timePass = moment()
        .utc()
        .subtract(GAME_TIME, 'seconds')
        .toISOString();
      count = await this.quizModel.countDocuments({
        starttime: {
          $gte: new Date(timePass),
        },
      });
      docs = await this.quizModel
        .find(
          {
            starttime: {
              $gte: new Date(),
            },
          },
          '-_id -__v',
        )
        .sort('starttime')
        .skip(+page * +limit)
        .limit(+limit);
    } else {
      count = await this.quizModel.countDocuments({});
      docs = await this.quizModel
        .find({}, '-_id -__v')
        .sort('-starttime')
        .skip(+page * +limit)
        .limit(+limit);
    }

    return {
      count,
      docs,
    };
  }

  getAllPublicActiveQuiz(
    userid: string,
    page: number,
    limit: number,
    game_type: string,
  ) {
    const gameTypeValidValues = ['question_win', 'game_win'];
    const gameType = game_type
      .split(',')
      .filter(item => gameTypeValidValues.includes(item));

    const pipline = [];

    pipline.push({
      $match: {
        starttime: {
          $gte: new Date(),
        },
        reward_type: {
          $in: gameType,
        },
      },
    });

    pipline.push({
      $sort: {
        starttime: 1,
      },
    });

    pipline.push({
      $skip: +page * +limit,
    });

    pipline.push({
      $limit: +limit,
    });

    pipline.push({
      $addFields: {
        hasJoined: {
          $in: [userid, '$joinedusers'],
        },
        questionCount: {
          $size: '$questionlist',
        },
      },
    });

    pipline.push({
      $project: {
        questionlist: 0,
        _id: 0,
        __v: 0,
      },
    });

    return this.quizModel.aggregate(pipline);
  }

  /*
   * {
        joined: true,
        message: `Joined quiz successfully!`,
   * }
   */
  async joinUserQuiz(userid: string, quizid: string) {
    let keys: any;
    let joined = false;
    let statusCode: any;
    let quizFull: boolean;
    let entryfee: number;

    // Start join session
    const session = await this.conn.startSession();
    try {
      await session.withTransaction(
        async () => {
          const products = await this.productsModel.findOne(
            // @ts-ignore
            { userid, productid: 'key' },
            'count',
            {
              session,
            },
          );

          if (products && products.count) {
            keys = products.count;
          } else {
            // Check if a free quiz
            keys = 0;
            //joined = false;
            //statusCode = 'M_QQ3';
            //return;
          }

          const quizInfo = await this.quizModel
            .aggregate([
              {
                $match: {
                  quizid,
                  status: {
                    $in: ['pending', 'queued'],
                  },
                  joinedusers: {
                    $ne: userid,
                  },
                },
              },
              {
                $project: {
                  entryfee: 1,
                  quizFull: {
                    $cond: {
                      if: {
                        $lt: [
                          {
                            $size: '$joinedusers',
                          },
                          '$roomsize',
                        ],
                      },
                      then: false,
                      else: true,
                    },
                  },
                },
              },
            ])
            .session(session);

          if (quizInfo.length === 0) {
            joined = false;
            statusCode = 'M_QQ4';
            return;
          }

          ({ entryfee, quizFull } = quizInfo[0]);

          if (quizFull) {
            joined = false;
            statusCode = 'M_QQ5';
            return;
          }

          if (entryfee > keys) {
            joined = false;
            statusCode = 'M_QQ6';
            return;
          }

          await this.productsModel.updateOne(
            {
              userid,
              // @ts-ignore
              productid: 'key',
            },
            { $inc: { count: -entryfee } },
            { session },
          );

          await this.quizModel.updateOne(
            {
              quizid,
            },
            { $push: { joinedusers: userid } },
            { session },
          );

          joined = true;
          statusCode = 'M_QQ7';
        },
        {
          readConcern: { level: 'local' },
          readPreference: 'primary',
          writeConcern: { w: 'majority' },
        },
      );
    } catch (error) {
      this.logger.error(error.toString());
      session.endSession();

      return {
        joined: false,
        statusCode: 'M_TRY_AGAIN',
      };
    } finally {
      session.endSession();

      if (joined) {
        try {
          await this.notificationService.sendToAll({
            data: {
              type: 'USER_JOINED',
              quizid,
              userid,
            },
            topic: 'all',
          });
        } catch (error) {
          this.logger.error(
            `failed to send the join  quiz notification -> `,
            error.toString(),
          );
        }
      }

      return {
        joined,
        statusCode,
      };
    }
  }

  async getQuiz(quizid: string) {
    const pipline = [];
    pipline.push({
      $match: {
        quizid,
      },
    });
    pipline.push({
      $match: {
        quizid,
      },
    });
    pipline.push({
      $addFields: {
        questionCount: {
          $size: '$questionlist',
        },
      },
    });

    pipline.push({
      $project: {
        questionlist: 0,
        _id: 0,
        __v: 0,
      },
    });

    const res = await this.quizModel.aggregate(pipline);
    if (Array.isArray(res) && res.length > 0) {
      return res[0];
    }
    return {};
  }

  async getUserJoinedQuiz(userid: string) {
    // TODO: get the quiz which are running or about to run!
    // Game Time 30 + ( 20 * 10 ) + ( 18 + 9 )
    const GAME_TIME = 30 + 20 * 10 + (18 + 9);
    const timePass = moment()
      .utc()
      .subtract(GAME_TIME, 'seconds')
      .toISOString();

    const pipline = [];

    pipline.push({
      $match: {
        status: {
          $nin: [StatusType.finised, StatusType.cancelled],
        },
        joinedusers: userid,
        starttime: { $gte: new Date(timePass) },
      },
    });

    pipline.push({
      $sort: {
        starttime: 1,
      },
    });

    pipline.push({
      $addFields: {
        hasJoined: {
          $in: [userid, '$joinedusers'],
        },
        questionCount: {
          $size: '$questionlist',
        },
      },
    });

    pipline.push({
      $project: {
        questionlist: 0,
        _id: 0,
        __v: 0,
      },
    });

    return this.quizModel.aggregate(pipline);
  }

  async getVipQuiz(userid: string, page: number, limit: number) {
    const pipline = [];

    pipline.push({
      $match: {
        status: {
          $ne: ['finished', 'cancelled'],
        },
        entryfee: {
          $gt: 0,
        },
        starttime: { $gte: new Date() },
      },
    });

    pipline.push({
      $sort: {
        starttime: 1,
      },
    });

    pipline.push({
      $skip: +page * +limit,
    });

    pipline.push({
      $limit: +limit,
    });

    pipline.push({
      $addFields: {
        hasJoined: {
          $in: [userid, '$joinedusers'],
        },
        questionCount: {
          $size: '$questionlist',
        },
      },
    });

    pipline.push({
      $project: {
        questionlist: 0,
        _id: 0,
        __v: 0,
      },
    });

    return this.quizModel.aggregate(pipline);
  }

  async getUpcomingQuiz(userid: string, page: number, limit: number) {
    const pipline = [];

    pipline.push({
      $match: {
        starttime: {
          $gte: new Date(),
        },
        status: {
          $ne: ['finished', 'cancelled'],
        },
      },
    });

    pipline.push({
      $sort: {
        starttime: 1,
      },
    });

    pipline.push({
      $skip: +page * +limit,
    });

    pipline.push({
      $limit: +limit,
    });

    pipline.push({
      $addFields: {
        hasJoined: {
          $in: [userid, '$joinedusers'],
        },
        questionCount: {
          $size: '$questionlist',
        },
      },
    });

    pipline.push({
      $project: {
        questionlist: 0,
        _id: 0,
        __v: 0,
      },
    });

    return this.quizModel.aggregate(pipline);
  }

  async getPopularQuiz(limit: number) {
    return await this.quizModel.aggregate([
      {
        $match: {
          status: {
            $ne: ['finished', 'cancelled'],
          },
          starttime: { $gte: new Date() },
        },
      },
      {
        $addFields: {
          pop_score: {
            $subtract: [
              `$roomsize`,
              {
                $size: '$joinedusers',
              },
            ],
          },
          questionCount: {
            $size: '$questionlist',
          },
        },
      },
      {
        $sort: {
          pop_score: 1,
        },
      },
      {
        $match: {
          pop_score: {
            $ne: 0,
          },
        },
      },
      {
        $project: {
          questionlist: 0,
          _id: 0,
          __v: 0,
          pop_score: 0,
        },
      },
      {
        $limit: +limit,
      },
    ]);
  }

  async deleteQuiz(quizid: string) {
    return this.quizModel.findOneAndDelete({
      quizid,
    });
  }

  async getQuizBanner() {
    return new Promise(r => {
      this.s3.listObjectsV2(
        {
          Bucket: 'knowin',
          Delimiter: '/',
          Prefix: 'quiz-banner/',
        },
        (err, data) => {
          if (err) {
            r([]);
          } else {
            r(
              data.Contents.map(item => {
                return `https://knowin.s3.amazonaws.com/${item.Key}`;
              }),
            );
          }
        },
      );
    });
  }

  async leaveQuiz(userid: string, quizid: string) {
    // check if the quiz is started yet or not
    const quizDoc = await this.quizModel.findOne({
      quizid,
      joinedusers: userid,
    });

    if (!quizDoc) {
      return {
        done: false,
        statusCode: getCode('M_NOT_FOUND'),
      };
    }

    const { starttime, entryfee } = quizDoc;
    const mt = moment(starttime)
      .utc()
      .diff(moment(), 'minutes');
    const isTimeToStartIsMoreThen30Min = mt >= 30;
    if (isTimeToStartIsMoreThen30Min) {
      await this.quizModel.updateOne(
        {
          quizid,
        },
        {
          $pull: {
            joinedusers: userid,
          },
        },
      );

      await this.productsModel.updateOne(
        { userid, productid: IProductTypes.key },
        {
          $inc: {
            count: entryfee,
          },
        },
      );

      return {
        done: true,
        statusCode: getCode('M_DONE'),
      };
    }

    return {
      done: false,
      statusCode: getCode('M_QQ8'),
    };
  }

  async cancelQuiz(quizid: string) {
    const quizDoc = await this.quizModel.findOne({
      quizid,
      status: StatusType.pending,
    });
    if (!quizDoc) {
      return {
        done: false,
        statusCode: getCode('M_NOT_FOUND'),
      };
    }

    const { joinedusers, entryfee } = quizDoc;

    await this.quizModel.updateOne(
      { quizid },
      {
        $set: {
          status: StatusType.cancelled,
        },
      },
    );

    await this.productsModel.updateMany(
      { userid: { $in: joinedusers }, productid: IProductTypes.key },
      {
        $inc: {
          count: entryfee,
        },
      },
    );

    await this.notificationService.sendNUsingIds(joinedusers, {
      type: getCodeN('GAME_CANCELLED'),
      quizid,
    });

    return {
      done: true,
      statusCode: getCode('M_DONE'),
    };
  }

  async getPlayedGames(page: number, limit: number) {
    const total = await this.playedGameModel.countDocuments();
    const docs = await this.playedGameModel
      .find({})
      .sort({
        playedTime: -1,
      })
      .skip(_.toNumber(page) * _.toNumber(limit))
      .limit(_.toNumber(limit));

    return {
      total,
      docs,
    };
  }

  async getSinglePlayedGames(quizid: string) {
    return this.playedGameModel.findOne({ quizid });
  }

  async getPlayerHistory(userid: string, page: number, limit: number) {
    const total = await this.quizModel.countDocuments({
      joinedusers: userid,
    });

    const docs = await this.quizModel
      .find({
        joinedusers: userid,
      })
      .sort({
        starttime: -1,
      })
      .skip(_.toNumber(page) * _.toNumber(limit))
      .limit(_.toNumber(limit));

    return {
      total,
      docs,
    };
  }

  async removeBanner(bannerid: string) {
    await new Promise((a, r) => {
      this.s3.deleteObject(
        {
          Bucket: 'knowin/quiz-banner',
          Key: bannerid,
        },
        (err, _) => {
          if (err) {
            this.logger.error(err, err.stack);
            r();
          } else {
            a();
          }
        },
      );
    });
  }

  async sendHook(
    entryfee: any,
    roomsize: any,
    starttime: any,
    type: any,
    category: any,
    winningprice: any,
    avatar: any,
  ) {
    console.log(arguments);
    const url =
      process.env.WEBHOOK_DISCORD ||
      'https://discord.com/api/webhooks/732957185889534082/lPnVRbM0DKSuDJaYCh9-dtDqOCfb2LWv_PxpSOXobtdAIGpxjyqK5TB9s3lTkMn560iD';

    const data = await axios({
      url,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        username: 'KnoWin-App',
        content: 'New Quiz!',
        title: 'New Quiz',
        url: avatar,
        color: 15258703,
        fields: [
          {
            name: 'Entry Fee',
            value: `${entryfee}`,
            inline: true,
          },
          {
            name: 'Room Size',
            value: `${roomsize}`,
            inline: true,
          },
          {
            name: 'Quiz will start',
            value: `${starttime}`,
            inline: true,
          },
          {
            name: 'Type',
            value: `${type}`,
            inline: true,
          },
          {
            name: 'Category',
            value: `${category}`,
            inline: true,
          },
          {
            name: 'Win Price',
            value: `${winningprice}`,
            inline: true,
          },
        ],
        thumbnail: {
          url: avatar,
        },
        image: {
          url: avatar,
        },
      },
    });
  }
}
