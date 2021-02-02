import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as moment from 'moment';
import { IQuestion } from 'knowin/common';
import { IQuestionStats } from '../analytics/interfaces/questionStats.interface';
import { IAnalytics } from 'knowin/common';
import { UpdateLeaderBoard } from '../leaderboard/dto/update-leaderboard.dto';
import { IAccount } from 'knowin/common';
import { VALUE_OF_1_POINT } from '../transaction/transaction.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel('Question') private readonly questionModel: Model<IQuestion>,
    @InjectModel('Analytics')
    private readonly analyticsModel: Model<IAnalytics>,
    @InjectModel('Account')
    private readonly accountsModel: Model<IAccount>,
  ) {}

  async getPointsStats(userid: string) {
    let total_points = 0,
      current_points = 0;

    const analyticsDoc = await this.analyticsModel.findOne({
      userid,
    });

    if (analyticsDoc) {
      total_points = analyticsDoc.total_earned;
    }

    const accountDoc = await this.accountsModel.findOne({
      userid,
    });

    if (accountDoc) {
      current_points = accountDoc.points;
    }

    const getMoney = (m: number): number => +(VALUE_OF_1_POINT * m).toFixed(2);

    // OK
    return {
      total_points,
      current_points,
      total_earn: getMoney(total_points),
      current_earn: getMoney(current_points),
    };
  }

  async getGraph(userid: string) {
    const dateExists = await this.analyticsModel.exists({ userid });
    if (!dateExists) {
      return [];
    }

    const start_day = moment()
      .utc()
      .subtract(7, 'd')
      .toISOString();
    const pipline = [];

    // match
    pipline.push({
      $match: {
        userid,
      },
    });

    pipline.push({
      $unwind: '$points_won',
    });

    pipline.push({
      $match: {
        'points_won.date': {
          $gt: new Date(start_day),
        },
      },
    });

    pipline.push({
      $sort: {
        'points_won.date': 1,
      },
    });

    pipline.push({
      $addFields: {
        date: '$points_won.date',
        points: '$points_won.points',
      },
    });

    pipline.push({
      $project: {
        _id: 0,
        date: 1,
        points: 1,
      },
    });

    const scores = await this.analyticsModel.aggregate(pipline);

    return scores;
  }

  updateQuestionStats(questionStats: IQuestionStats[]) {
    return new Promise((resolve, rejects) => {
      this.questionModel
        .bulkWrite(
          questionStats.map(({ questionId, wrong, correct }) => {
            return {
              updateOne: {
                filter: {
                  questionid: questionId,
                },
                update: {
                  $inc: {
                    win: correct,
                    played: wrong + correct,
                  },
                },
              },
            };
          }),
        )
        .then(() => {
          resolve();
        })
        .catch(err => {
          Logger.error(err.toString());
          rejects(err.toString());
        });
    });
  }

  async updateQuestionStatsByOne(ids: string[]) {
    await this.questionModel.updateMany(
      {
        questionid: {
          $in: ids,
        },
      },
      {
        $inc: {
          played: 1,
        },
      },
    );
  }

  async updateAnalytics(board: UpdateLeaderBoard) {
    const { winners } = board;
    const today_utc = moment()
      .utc()
      .toISOString();
    return new Promise((resolve, rejects) => {
      this.analyticsModel
        .bulkWrite(
          winners.map(({ id, won_price }) => {
            return {
              updateOne: {
                filter: {
                  userid: id,
                },
                update: {
                  $push: {
                    points_won: {
                      date: today_utc,
                      points: won_price,
                    },
                  },
                  $inc: {
                    total_earned: won_price,
                  },
                },
                upsert: true,
              },
            };
          }),
        )
        .then(() => {
          resolve();
        })
        .catch(err => {
          Logger.error(err.toString());
          rejects(err.toString());
        });
    });
  }
}
