import { Injectable } from '@nestjs/common';
import { Model } from 'mongoose';
import {
  ISpinWin,
  SpinWinType,
  ISpinner,
  IAccount,
  IProducts,
  IProductTypes,
} from 'knowin/common';
import { InjectModel } from '@nestjs/mongoose';

export interface IChoices {
  id: string;
  per: number;
}

@Injectable()
export class PromotionsService {
  private readonly MAX_GAMES = 10;
  constructor(
    @InjectModel('Spinwin') private readonly spinWinModel: Model<ISpinWin>,
    @InjectModel('Spinner') private readonly spinnerModel: Model<ISpinner>,
    @InjectModel('Products') private readonly productsModel: Model<IProducts>,
    @InjectModel('Account') private readonly accountModel: Model<IAccount>,
  ) {}
  private spin(prob: any) {
    let i: any,
      sum = 0,
      r = Math.random();
    for (i in prob) {
      sum += prob[i];
      if (r <= sum) return i;
    }
  }

  async after10GameSpinResults(userid: string, type: SpinWinType) {
    const { eligible } = await this.checkEligibility(userid, type);

    if (eligible) {
      const spinDoc = await this.spinnerModel.findOne({ type, active: true });
      let options = {};
      spinDoc.options.forEach(ops => {
        options[ops.id] = ops.weightage;
      });

      let result = this.spin(options);
      await this.decGameCount(userid, this.MAX_GAMES, type);
      let won = spinDoc.options.find(ops => ops.id === +result).prize;
      await this.addPrize(won, userid);

      return {
        result: +result,
        won,
      };
    }

    throw new Error('Not Eligible');
  }

  async addPrize(result: any, userid: string) {
    const won = [];
    Object.keys(result).filter((key: string) => {
      if (result[key] > 0) {
        won.push({
          id: key,
          count: result[key],
        });
      }
    });

    won.forEach(async ({ id, count }) => {
      switch (id) {
        case IProductTypes.key:
        case IProductTypes.two_answer:
        case IProductTypes.fifty_fifty:
        case IProductTypes.pass_question:
        case IProductTypes.extra_life_joker:
          await this.productsModel.updateOne(
            {
              userid,
              productid: id,
            },
            {
              $inc: {
                count: count,
              },
            },
          );
        case 'points':
          await this.accountModel.updateOne(
            { userid },
            {
              $inc: {
                points: count,
              },
            },
          );
      }
    });
  }

  async decGameCount(userid: string, count: number, type: SpinWinType) {
    if (typeof count !== 'number') {
      count = Number(count);
    }
    await this.spinWinModel.updateOne(
      { userid, type },
      {
        $inc: {
          gamePlayed: -count,
        },
      },
    );
  }

  async checkEligibility(userid: string, type: SpinWinType) {
    const userDoc = await this.spinWinModel.findOne({ userid, type });
    const spinnerId = await this.spinnerModel.findOne(
      { type, active: true },
      'spinnerId',
    );
    if (userDoc && userDoc.gamePlayed >= this.MAX_GAMES) {
      return {
        eligible: true,
        gamePlayed: userDoc.gamePlayed,
        spinnerId: spinnerId ? spinnerId.spinnerId : 0,
      };
    }

    return {
      eligible: false,
      gamePlayed: userDoc ? userDoc.gamePlayed : 0,
      spinnerId: spinnerId ? spinnerId.spinnerId : 0,
    };
  }

  // Spinners
  getSpinner() {
    return this.spinnerModel.find({}, 'spinnerId active');
  }
}
