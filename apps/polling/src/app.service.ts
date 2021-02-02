import { Logger, Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { maxBy } from 'lodash';
import { GoogleToken } from 'gtoken';
import { NotificationService } from './notification/notification.service';
import axios from 'axios';
import { Model } from 'mongoose';
import {
  IQuiz,
  IUser,
  StatusType,
  IPurchase,
  IProducts,
  IPackage,
  IProductTypes,
  IAnalytics,
  Status,
} from 'knowin/common';
import { getCodeN } from 'knowin/status-codes';
import * as moment from 'moment';
import configuration from './config/configuration';
import { InjectModel } from '@nestjs/mongoose';
import { IAccount } from 'knowin/common/interfaces/account.interface';

export interface IQuizMeta {
  starttime: Date;
  quizid: string;
}

@Injectable()
export class AppService implements OnModuleInit {
  private logger = new Logger('Pooling Microservice');
  private token: GoogleToken = new GoogleToken({
    email: process.env.GOOGLE_APPLICATION_PLAYSTORE_CLIENT_EMAIL,
    key: JSON.parse(
      `"${process.env.GOOGLE_APPLICATION_PLAYSTORE_PRIVATE_KEY}"`,
    ),
    scope: ['https://www.googleapis.com/auth/androidpublisher'],
  });
  constructor(
    @InjectModel('Quiz') private readonly quizModel: Model<IQuiz>,
    @InjectModel('Users') private readonly userModel: Model<IUser>,
    @InjectModel('Purchase') private readonly purchaseModel: Model<IPurchase>,
    @InjectModel('Products') private readonly productsModel: Model<IProducts>,
    @InjectModel('Packages') private readonly packagesModel: Model<IPackage>,
    @InjectModel('Account') private readonly accountModel: Model<IAccount>,
    @InjectModel('Analytics')
    private readonly analyticsModel: Model<IAnalytics>,
    private readonly notification: NotificationService,
  ) {}

  onModuleInit() {
    // On start fetchQuiz then after every 1 min
    this.fetchQuiz();
    this.notify();
    this.refundSeq();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  fetchQuiz() {
    const currentDate = moment()
      .utc()
      .valueOf();
    const pastFiveMinDate = moment()
      .utc()
      .add(5, 'minute')
      .valueOf();

    this.quizModel.find(
      {
        starttime: {
          $gte: new Date(currentDate),
          $lt: new Date(pastFiveMinDate),
        },
        status: {
          $in: [StatusType.pending],
        },
      },
      (err: any, quizzes: IQuiz[]) => {
        if (!err && quizzes.length > 0) {
          this.logger.log(`Found ${quizzes.length}`);
          this.logger.log(`Will Start the quiz`);

          quizzes.forEach(quiz => {
            this.startGame({
              starttime: quiz.starttime,
              quizid: quiz.quizid,
            });
          });
        } else {
          if (err) {
            this.logger.log(`Error in scheduler`);
            this.logger.log(err);
          } else {
            this.logger.log(`No quiz found!  ${new Date().toISOString()}`);
          }
        }
      },
    );
  }

  // can do better
  @Cron(CronExpression.EVERY_HOUR)
  notify() {
    // Send notification if 30 min, 5 min, 2 min left for game start
    const currentDate = moment()
      .utc()
      .valueOf();
    const past30MinDate = moment()
      .utc()
      .add(30, 'minute')
      .valueOf();

    this.quizModel.find(
      {
        starttime: {
          $gte: new Date(currentDate),
          $lt: new Date(past30MinDate),
        },
        status: {
          $in: [StatusType.queued, StatusType.pending],
        },
      },
      (err, quizzes: IQuiz[]) => {
        if (!err && quizzes.length > 0) {
          this.logger.log(
            `Found ${quizzes.length} quiz that are scheduled for the next 30 min`,
          );
          quizzes.forEach(async ({ starttime, quizid, joinedusers }) => {
            const timeLeft = moment(starttime).diff(currentDate, 'minute');
            this.logger.log(timeLeft);
            let shouldSend = false;
            let notifyID: any;

            if (timeLeft === 30) {
              shouldSend = true;
              notifyID = getCodeN('GAME_START_IN_30_MIN');
            } else if (timeLeft === 5) {
              shouldSend = true;
              notifyID = getCodeN('GAME_START_IN_5_MIN');
            } else if (timeLeft === 2) {
              shouldSend = true;
              notifyID = getCodeN('GAME_START_IN_5_MIN');
            }

            if (shouldSend) {
              const users = await this.getUsersData(joinedusers);
              const fcmTokens = users.map(user => ({
                fcm_token: user.fcm_token,
                locale: user.locale,
              }));
              this.notification.send(fcmTokens, {
                type: notifyID,
                quizid,
              });
            }
          });
        } else {
          this.logger.log(`No quiz found!  ${new Date().toISOString()}`);
        }
      },
    );
  }

  async getUsersData(ids: string[]): Promise<any[]> {
    return this.userModel.find(
      {
        userid: {
          $in: ids,
        },
      },
      {
        projection: {
          fcm_token: 1,
          locale: 1,
        },
      },
    );
  }

  async startGame(quiz: IQuizMeta) {
    this.logger.log(`[StartGame] `);
    this.logger.log(quiz);

    try {
      await axios({
        method: 'post',
        url: `${configuration.services.game}/start_new_game`,
        data: {
          ...quiz,
        },
        headers: {
          Authorization: configuration.secret.GAME_API_ACCESS_TOKEN,
        },
      });
    } catch (e) {
      /* handle error */
      this.logger.log(e.toString());
      this.logger.log(e.response.data);
    }
  }

  // Fetch user's who are doing refunds
  // Api limit is 6000 in a single day
  // So be sure we don't hit more then that are going to hit
  // 1 after every min with will be 1440 requests per day
  // ----
  // Think about Someone have 0 keys and He was bought 25 keys and I was registered
  // some quizzes and He was used 10 keys but just 3 keys was used on real I mean he
  // was played the other 7 keys he is waiting for quiz play .
  // So that time we will reduce 22 keys from user also what ever he was earned from that quizzes.
  // That time we don’t need block him but if he will do again That time  we will
  // block him for 3 days . If he will do same again for third  time we will block for forever
  //
  //
  @Cron(CronExpression.EVERY_30_MINUTES)
  async refundSeq() {
    // fetch refund users
    const gtoken = await this.token.getToken();
    this.logger.log(`GToken fetch`);
    const recipts = await this.fetchRecipts(gtoken.access_token);

    if (recipts.voidedPurchases) {
      const { voidedPurchases } = recipts;
      const allOrderIds = voidedPurchases.map(({ orderId }) => orderId);
      console.log(allOrderIds);
      const voidedPurchasesWithId = await this.purchaseModel.find(
        {
          orderId: { $in: allOrderIds },
          refundMade: false,
        },
        'userid productId updatedAt',
      );

      // The result
      console.log(voidedPurchasesWithId);

      for (const purchase of voidedPurchasesWithId) {
        const { userid, productId, updatedAt } = purchase;
        // we have the userid and productId from which the purchases was voided

        // fetch the package info frist
        const productInfo = await this.packagesModel.findOne({
          packageId: productId,
        });

        if (!productInfo) {
          throw new Error('A refund product is no loger in the database');
        }

        const {
          keyCount,
          heartCount,
          passCount,
          twoAnswerCount,
          fiftyFiftyCount,
        } = productInfo;

        // Check how many produts they have now
        const keysDoc = await this.fetchProductsByUserID(
          userid,
          IProductTypes.key,
        );
        const heartDoc = await this.fetchProductsByUserID(
          userid,
          IProductTypes.extra_life_joker,
        );
        const passDoc = await this.fetchProductsByUserID(
          userid,
          IProductTypes.pass_question,
        );
        const twoAnswerDoc = await this.fetchProductsByUserID(
          userid,
          IProductTypes.two_answer,
        );
        const fiftyFiftyDoc = await this.fetchProductsByUserID(
          userid,
          IProductTypes.fifty_fifty,
        );

        // we don't have to mark negitive just have to take all the product and if still
        // we are due we have to take the points
        const query = [
          {
            id: IProductTypes.key,
            bought: keyCount,
            has: keysDoc.count,
          },
          {
            id: IProductTypes.extra_life_joker,
            bought: heartCount,
            has: heartDoc.count,
          },
          {
            id: IProductTypes.two_answer,
            bought: twoAnswerCount,
            has: twoAnswerDoc.count,
          },
          {
            id: IProductTypes.pass_question,
            bought: passCount,
            has: passDoc.count,
          },
          {
            id: IProductTypes.fifty_fifty,
            bought: fiftyFiftyCount,
            has: fiftyFiftyDoc.count,
          },
        ];

        let toRemovepoints = false;

        this.logger.log(query);

        // bulk upate
        await this.productsModel.bulkWrite(
          query.map(({ id, bought, has }) => {
            let left = has - bought;

            if (left < 0) {
              if (id == IProductTypes.key) {
                toRemovepoints = true;
              }

              left = 0;
            }

            return {
              updateOne: {
                filter: {
                  userid,
                  productid: id,
                },
                update: {
                  $set: {
                    count: left,
                  },
                },
              },
            };
          }),
        );

        // now remove the points
        if (toRemovepoints) {
          // check the largest amount of points a user have earned after the transaction
          const pointsList = await this.analyticsModel.aggregate([
            {
              $match: {
                userid,
              },
            },
            {
              $unwind: '$points_won',
            },
            {
              $match: {
                'points_won.date': {
                  $gte: new Date(updatedAt),
                },
              },
            },
          ]);

          this.logger.log('pointsList');
          this.logger.log(pointsList);
          if (pointsList.length > 0) {
            const mostpoints = maxBy(pointsList, o => o.points_won.points);
            // remove mostpoints from the user's account
            await this.accountModel.updateOne(
              { userid },
              {
                $inc: {
                  points: -mostpoints.points_won.points,
                },
              },
            );
          }
        }

        //mark the transaction as done
        await this.purchaseModel.updateOne(
          {
            orderId: { $in: allOrderIds },
            refundMade: false,
          },
          { $set: { refundMade: true } },
        );

        // check if the user has done it 2nd time if yes block his ass
        const refundCount = await this.purchaseModel.countDocuments({
          userid,
          refundMade: true,
        });
        const userdata = await this.getUsersData([userid]);
        // send notification to the user
        const fcmTokens = userdata.map(user => ({
          fcm_token: user.fcm_token,
          locale: user.locale,
        }));

        if (refundCount > 1) {
          await this.userModel.updateOne(
            { userid },
            {
              $set: {
                status: Status.blocked,
              },
            },
          );

          this.notification.send(fcmTokens, {
            type: getCodeN('REFUND_TRANSACTION_BLOCK'),
            quizid: null,
          });
        } else {
          this.notification.send(fcmTokens, {
            type: getCodeN('REFUND_TRANSACTION'),
            quizid: null,
          });
        }
      }
    }
  }

  async fetchProductsByUserID(
    userid: string,
    productid: IProductTypes,
  ): Promise<IProducts> {
    return this.productsModel.findOne(
      {
        userid,
        productid,
      },
      'count',
    );
  }

  async fetchRecipts(token: string) {
    const url = (token: string) =>
      `https://www.googleapis.com/androidpublisher/v3/applications/com.smn.knowin.quiz/purchases/voidedpurchases?access_token=${token}`;
    try {
      const result = await axios.get(url(token));
      return result.data;
    } catch (err) {
      this.logger.error(`Error in fetching refund recipts`);
      this.logger.log(err.toString());
    }
  }
}
