import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAccount } from 'knowin/common';
import { UsersService } from '../users/users.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationService } from '../notification/notification.service';

export interface IAccountInfoUpdateQuery {
  userid?: string;
  iban_no?: string;
}

export interface IBulkUpdatePoints {
  id: string;
  won_price: number;
}

@Injectable()
export class AccountService {
  private logger = new Logger('AccountService');
  private POINT_LIMIT = 500;
  private REFERENT_POINTS = 100;
  constructor(
    @InjectModel('Account') private readonly accountModel: Model<IAccount>,
    private readonly userService: UsersService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  async getAccountInfo(userid: string) {
    return this.accountModel.findOne({ userid }, '-_id -__v');
  }

  async getAccountInfoV2(userid: string, projectons: string) {
    return this.accountModel.findOne({ userid }, projectons);
  }

  async getAccountPoints(userid: string) {
    return this.accountModel.findOne({ userid }, { points: 1, _id: 0 });
  }

  // Find Account Using UserId And Increment Points By Given Points
  async addInfo(query: IAccountInfoUpdateQuery) {
    return this.accountModel.findOneAndUpdate(
      { userid: query.userid },
      { $set: { iban_no: query.iban_no } },
    );
  }

  // TODO:
  async updatePointsOnReferalCompleted() {
    // fetch account wherer referal is not completed and points are equal or gte then point limit
    const valid_accounts = await this.accountModel.find(
      {
        referal_completed: false,
        points: {
          $gte: this.POINT_LIMIT + 50,
        },
      },
      'userid',
    );

    if (valid_accounts.length > 0) {
      // get all ids
      const ids = valid_accounts.map(({ userid }) => userid);
      const toGiveIds = await this.userService.getRefInfo(ids);

      if (toGiveIds.length > 0) {
        await this.accountModel.updateMany(
          {
            userid: {
              $in: toGiveIds,
            },
          },
          {
            $inc: {
              points: this.REFERENT_POINTS,
            },
          },
        );

        await this.accountModel.updateMany(
          {
            userid: {
              $in: ids,
            },
          },
          {
            $set: {
              referal_completed: true,
            },
          },
        );

        const winners = toGiveIds.map(id => {
          return {
            id,
            won_price: this.REFERENT_POINTS,
          };
        });

        await this.analyticsService.updateAnalytics({
          winners,
          quizid: 'none',
          qstats: [],
        });

        const tokenWithLocale = await this.userService.getFcmTokens(toGiveIds);
        this.notificationService.sendWithL(tokenWithLocale, {
          type: 'REFERRAL_RECIVED',
          quizid: 'none',
        });
      }
      // update same for analytics
    }
  }

  async blulkAddPoints(updateDto: IBulkUpdatePoints[]) {
    await this.accountModel.bulkWrite(
      updateDto.map(({ id, won_price }) => {
        return {
          updateOne: {
            filter: {
              userid: id,
            },
            update: {
              $inc: {
                points: won_price,
              },
            },
          },
        };
      }),
    );

    await this.updatePointsOnReferalCompleted();
  }
}
