import { Injectable, Logger } from '@nestjs/common';
import { AddTransactionDto } from '../transaction/dto/add-transactions.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { v4 as uid } from 'uuid';
import {
  ITransaction,
  ITransactionStatus,
} from '../transaction/interfaces/transaction.interface';
import { IAccount, IUser } from 'knowin/common';
import { NotificationService } from '../notification/notification.service';

export interface IListOptions {
  page: string;
  limit: string;
  showPaid: string;
  showUnPaid: string;
  showCanceled: string;
  showFailed: string;
}

export const VALUE_OF_1_POINT = 0.01; // in $

@Injectable()
export class TransactionService {
  private readonly SMALLEST_TRANSACTION = 1000; // in $

  constructor(
    @InjectModel('Transactions')
    private readonly transactionModel: Model<ITransaction>,
    @InjectModel('Account')
    private readonly accountModel: Model<IAccount>,
    @InjectModel('Users')
    private readonly userModel: Model<IUser>,
    private readonly notificationService: NotificationService,
  ) {}

  async addNewTransaction(newTransaction: AddTransactionDto, userid: string) {
    const transaction_id = uid();
    let { points: pointsToRedeem } = newTransaction;
    // TODO: make it inside a transaction
    Logger.log(typeof pointsToRedeem);

    if (typeof pointsToRedeem !== 'number') {
      throw new Error(`Points should be a number value`);
    }

    if (pointsToRedeem <= 0) {
      throw new Error(`Can't redeem nothing`);
    }

    if (this.SMALLEST_TRANSACTION > pointsToRedeem) {
      throw new Error(
        `Only points amount above ${this.SMALLEST_TRANSACTION} can be redeemed`,
      );
    }

    pointsToRedeem = +pointsToRedeem.toFixed(2);

    // check user have points to redeem!
    const { points: pointsUserHave, iban_no } = await this.accountModel.findOne(
      { userid },
      'points iban_no',
    );

    if (!this.isIBAN(iban_no)) {
      throw new Error(`Please update a correct IBAN for the transaction!`);
    }

    const { name, mobile } = await this.userModel.findOne(
      { userid },
      'name mobile',
    );

    if (pointsUserHave < pointsToRedeem) {
      throw new Error(`Your don't have enough points!`);
    }

    // Remove points form account
    await this.accountModel.updateOne(
      { userid },
      {
        $inc: {
          points: -pointsToRedeem,
        },
      },
    );

    const doller = (VALUE_OF_1_POINT * pointsToRedeem).toFixed(2);

    await this.transactionModel.create({
      transaction_id,
      userid,
      exchange_rate: VALUE_OF_1_POINT,
      points: pointsToRedeem,
      doller,
      message: 'Transaction is pending',
      iban_no,
      name,
      mobile,
    });

    return {
      transaction_id,
      userid,
      exchange_rate: VALUE_OF_1_POINT,
      points: pointsToRedeem,
      doller,
      message: 'Transaction is pending',
      iban_no,
      name,
      mobile,
    };
  }

  // TODO pagination
  listAllTransactions(userid: string, limit: number, page: number) {
    if (!limit) {
      limit = 10;
    }

    if (!page) {
      page = 0;
    }
    return this.transactionModel
      .find({ userid }, '-_id -__v -updatedAt')
      .sort({ createdAt: -1 })
      .skip(+limit * +page)
      .limit(+limit);
  }

  // Admins --
  async _markTransactions(
    transactionId: string,
    status: ITransactionStatus,
    message: string,
  ) {
    // Status shuould be on of follwing values
    const statusValues: ITransactionStatus[] = [
      'failed',
      'pending',
      'paid',
      'canceled',
    ];

    if (!statusValues.includes(status)) {
      return {
        done: false,
        statusCode: `M_T2`,
      };
    }

    // Can't update a failed transaction coz the points are added to the users's account
    const { status: currnetStatus } = await this.transactionModel.findOne({
      transaction_id: transactionId,
    });

    if (currnetStatus === 'failed') {
      // the status if failed
      return {
        done: false,
        statusCode: `M_T3`,
      };
    }

    // mark means a transaction has happened
    const transData = await this.transactionModel.findOneAndUpdate(
      { transaction_id: transactionId },
      {
        $set: {
          status,
          message,
        },
      },
      {
        new: true,
      },
    );

    const { userid, points } = transData;

    // if was a failed transaction send money back
    if (status === 'failed') {
      await this.accountModel.updateOne(
        {
          userid,
        },
        {
          $inc: {
            points: points,
          },
        },
      );
    }

    await this.notificationService.sendUsingId(userid, {
      type: 'NOTIFICATION_SAVE',
      transactionId,
      message,
    });

    return {
      done: true,
      statusCode: 'M_DONE',
    };
  }

  async _listAllTransactions(listOptions: IListOptions) {
    // Count
    const pipline = [];
    const filters = [];

    if (listOptions.showPaid === 'on') {
      filters.push('paid');
    }

    if (listOptions.showFailed === 'on') {
      filters.push('failed');
    }

    if (listOptions.showUnPaid == 'on') {
      filters.push('pending');
    }
    if (listOptions.showCanceled == 'on') {
      filters.push('canceled');
    }

    if (filters.length > 0) {
      pipline.push({
        $match: {
          status: {
            $in: filters,
          },
        },
      });
    }

    const total = await this.transactionModel.aggregate([
      ...pipline,
      {
        $count: 'count',
      },
    ]);

    pipline.push({
      $sort: {
        createdAt: -1,
      },
    });

    pipline.push({
      $skip: +listOptions.limit * +listOptions.page,
    });

    pipline.push({
      $limit: +listOptions.limit,
    });

    const transactions = await this.transactionModel.aggregate(pipline);

    return {
      total,
      transactions,
    };
  }

  isIBAN(iban: string) {
    // some validation later

    return !!iban;
  }

  // Stats
  //async getStats(userid: string) {

  //return {};
  //}
}
