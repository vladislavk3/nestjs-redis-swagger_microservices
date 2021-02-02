import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as _ from 'lodash';
import {
  IProducts,
  IProductTypes,
  IPurchase,
  IPackage,
  PurchaseMode,
  IAccount,
} from 'knowin/common';
import { getCode } from 'knowin/status-codes';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import * as iap from 'in-app-purchase';
import { AddPakckageDto } from './dto/add-package.dto';

@Injectable()
export class ProductsService implements OnModuleInit {
  private logger = new Logger('ProductsService');
  constructor(
    @InjectModel('Products') private readonly productModel: Model<IProducts>,
    @InjectModel('Purchase') private readonly purchaseModel: Model<IPurchase>,
    @InjectModel('Packages') private readonly packageModel: Model<IPackage>,
    @InjectModel('Account') private readonly accountModel: Model<IAccount>,
  ) {}

  onModuleInit() {
    iap.config({
      googleServiceAccount: {
        clientEmail: process.env.GOOGLE_APPLICATION_PLAYSTORE_CLIENT_EMAIL,
        privateKey: JSON.parse(
          `"${process.env.GOOGLE_APPLICATION_PLAYSTORE_PRIVATE_KEY}"`,
        ),
      },
    });
  }

  getProductsInfo(userid: string) {
    return this.productModel.find({ userid }, '-_id -userid -__v');
  }

  async verifyAndAddPackage(userid: string, receipt: any) {
    // Step 1: Check if alredy added and verifyed
    let purchaseExistsAndVeifyed: boolean;

    try {
      purchaseExistsAndVeifyed = await this.purchaseModel.exists({
        productId: receipt.productId,
        purchaseToken: receipt.purchaseToken,
        orderId: receipt.orderId,
        coinPurchase: false,
      });
    } catch (err) {
      this.logger.error(`Error in [verifyAndAddPackage] `, err.toString());
      return {
        status: false,
        statusCode: 'M_TRY_AGAIN',
      };
    }

    if (purchaseExistsAndVeifyed) {
      return {
        status: true,
        statusCode: 'M_P3',
      };
    } else {
      try {
        const { done, data } = await this.iapVerify(receipt);

        if (done) {
          // Add products and a new record of purchase
          await this.purchaseModel.create({
            userid,
            productId: receipt.productId,
            purchaseToken: receipt.purchaseToken,
            orderId: receipt.orderId,
            coinPurchase: false,
          });
          return await this.redeemPackage(userid, receipt.productId);
        } else {
          return {
            status: false,
            statusCode: 'M_P4',
            data,
          };
        }
      } catch (error) {
        return {
          status: false,
          statusCode: 'M_P4',
        };
      }
    }
  }

  async iapVerify(
    receipt: any,
  ): Promise<{
    done: boolean;
    data: any;
  }> {
    return new Promise((accept, reject) => {
      iap
        .setup()
        .then(() => {
          iap
            .validate(receipt)
            .then(data => {
              accept({ done: true, data });
            })
            .catch(err => {
              this.logger.error(`Error in [iapVerify]`, err.toString());
              reject({ done: false, data: {} });
            });
        })
        .catch(err => {
          this.logger.error(`Error in [iapVerify]`, err.toString());
          reject({ done: false, data: {} });
        });
    });
  }

  async buyPackageUsingCoins(userid: string, packageId: string) {
    try {
      // package info
      const packageInfo = await this.packageModel.findOne({
        packageId,
      });

      if (!packageInfo) {
        return {
          status: false,
          statusCode: 'M_NOT_FOUND',
        };
      }
      if (packageInfo.purchaseMode !== PurchaseMode.coin) {
        return {
          status: false,
          statusCode: 'M_NOT_FOUND',
        };
      }

      // Check if the user have to amount of coins to purchase
      const { points } = await this.accountModel.findOne({ userid }, 'points');

      if (points < packageInfo.priceSold) {
        return {
          status: false,
          statusCode: 'M_P5',
        };
      }

      await this.purchaseModel.create({
        userid,
        productId: packageInfo.packageId,
        coinPurchase: true,
      });

      await this.accountModel.updateOne(
        {
          userid,
        },
        {
          $inc: {
            points: -packageInfo.priceSold,
          },
        },
      );

      return this.redeemPackage(userid, packageId);

      // let's first dec points from the accout
    } catch (error) {
      this.logger.log(error);
      return {
        status: false,
        statusCode: 'M_P4',
      };
    }
  }

  // Add the content of the package or single items bought but the use
  // NOTE: Verify function will be here!
  async redeemPackage(userid: string, packageId: string) {
    let status = false;
    let statusCode: any;

    try {
      // Fetch the info from the database about the package.
      const packageInfo = await this.packageModel.findOne({
        packageId,
      });

      if (!packageInfo) {
        statusCode = 'M_P0';
        Logger.log(
          `Failed Purchase +++++++++++++++++++++++++++++++++++++++++++++++++ Failed Purchase`,
        );
        Logger.log(
          `--------------------------The Products was not in the DB-------------------------`,
        );
        Logger.log(
          `--------------------User Id: ${userid} Package ID: ${packageId}------------------`,
        );
        Logger.log(
          `Failed Purchase +++++++++++++++++++++++++++++++++++++++++++++++++ Failed Purchase`,
        );
      } else {
        const {
          keyCount,
          fiftyFiftyCount,
          heartCount,
          twoAnswerCount,
          passCount,
        } = packageInfo;

        const productids: Array<{
          productid: IProductTypes;
          count: number;
        }> = [];

        if (keyCount > 0) {
          productids.push({
            productid: IProductTypes.key,
            count: keyCount,
          });
        }

        if (fiftyFiftyCount > 0) {
          productids.push({
            productid: IProductTypes.fifty_fifty,
            count: fiftyFiftyCount,
          });
        }

        if (heartCount > 0) {
          productids.push({
            productid: IProductTypes.extra_life_joker,
            count: heartCount,
          });
        }

        if (twoAnswerCount > 0) {
          productids.push({
            productid: IProductTypes.two_answer,
            count: twoAnswerCount,
          });
        }

        if (passCount > 0) {
          productids.push({
            productid: IProductTypes.pass_question,
            count: passCount,
          });
        }

        await this.productModel.bulkWrite(
          productids.map(({ productid, count }) => {
            return {
              updateOne: {
                filter: {
                  userid,
                  productid,
                },
                update: {
                  $inc: {
                    count,
                  },
                },
                upsert: true,
              },
            };
          }),
        );
        status = true;
        statusCode = 'M_P1';
      }
    } catch (error) {
      this.logger.error(error.toString());
      status = false;
      statusCode = 'M_P2';
    }

    return {
      status,
      statusCode,
    };
  }

  // Adding products
  async addNewPackage(addPackage: AddPakckageDto) {
    if (_.has(addPackage, '_id')) {
      const { _id, ...rest } = addPackage;
      try {
        await this.packageModel.updateOne(
          {
            _id,
          },
          {
            $set: {
              ...rest,
            },
          },
          {
            upsert: true,
          },
        );
        return {
          status: true,
          message: `Added new package`,
        };
      } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
          return {
            status: false,
            message: 'Dublicate Package ID',
          };
        } else {
          return {
            status: false,
            message: 'Something went wrong!',
          };
        }
      }
    } else {
      try {
        await this.packageModel.create(addPackage);
        return {
          status: true,
          message: `Added new package`,
        };
      } catch (error) {
        if (error.name === 'MongoError' && error.code === 11000) {
          Logger.log(error);
          return {
            status: false,
            message: 'Dublicate Package ID',
          };
        } else {
          return {
            status: false,
            message: 'Something went wrong!',
          };
        }
      }
    }
  }

  async getPackages(page: number, limit: number) {
    const total = await this.packageModel.countDocuments();
    const packages = await this.packageModel
      .find({}, '-__v')
      .skip(+limit * +page)
      .limit(+limit);

    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {
        total,
        packages,
      },
    };
  }

  async deletePackage(id: string) {
    const res = await this.packageModel.deleteOne({
      packageId: id.trim(),
    });
  }

  async getPurchaseHistory(
    page: number,
    limit: number,
    types: string[],
    onlyRefund: boolean,
    search: string,
  ) {
    const pipline = [];

    pipline.push({
      $sort: {
        createdAt: -1,
      },
    });

    if (_.isArray(types)) {
      let setBoth = types.includes('coin') && types.includes('money');

      if (!setBoth) {
        let setCoin = types.includes('coin');
        pipline.push({
          $match: {
            coinPurchase: setCoin,
          },
        });
      }
    }

    if (_.isBoolean(onlyRefund) && onlyRefund) {
      pipline.push({
        $match: {
          refundMade: true,
        },
      });
    }

    let matchPipe = [
      {
        $match: {
          $expr: {
            $eq: ['$userid', '$$userid'],
          },
        },
      },
    ];

    if (search !== '' && !_.isEmpty(search)) {
      matchPipe[0].$match['$text'] = {
        $search: search,
      };
    }

    pipline.push({
      $lookup: {
        from: 'users',
        let: {
          userid: '$userid',
        },
        pipeline: matchPipe,
        as: 'userinfo',
      },
    });

    pipline.push({
      $unwind: '$userinfo',
    });

    let countPipe = [
      ...pipline,
      {
        $count: 'total',
      },
    ];

    let totalDoc = await this.purchaseModel.aggregate(countPipe);

    pipline.push({
      $project: {
        userid: 1,
        createdAt: 1,
        refundMade: 1,
        productId: 1,
        orderId: 1,
        coinPurchase: 1,
        userinfo: {
          username: 1,
          name: 1,
          avatar: 1,
          mobile: 1,
        },
        count: 1,
      },
    });

    pipline.push({
      $skip: _.toNumber(page) * _.toNumber(limit),
    });

    pipline.push({
      $limit: _.toNumber(limit),
    });

    let purchase_list = await this.purchaseModel.aggregate(pipline);
    return {
      total: _.has(totalDoc[0], 'total') ? totalDoc[0].total : 0,
      purchase_list,
    };
  }

  // Refund Seq
  // @Apple hit a post api in our server to tell us when a refund is succesful
  //  - we have to make a post api endpoint
  //  - This api is in this service itself coz it does not effect on the no of instances
  // @Google has a api from where we can query for refund's
  //  - We have to shedule a api call for x amount of time to fetch the refund recipts
  //  - This shedule api call is in polling service becouse we want only one instances to call
  //    that api

  appleRefund(receipt: any) {
    // Only process the recipt if the notification_type is REFUND
    if (receipt.notification_type === 'REFUND') {
      // TODO: refund here
    }
  }
}
