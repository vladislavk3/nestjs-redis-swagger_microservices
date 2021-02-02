import { Injectable, Logger } from '@nestjs/common';
import * as moment from 'moment';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ILeaderBoard,
  IDateGroup,
} from '../leaderboard/interfaces/leaderboard.interface';
import { UpdateLeaderBoard } from '../leaderboard/dto/update-leaderboard.dto';
import { IQuiz } from 'knowin/common';
import { AnalyticsService } from '../analytics/analytics.service';
import { AccountService } from '../account/account.service';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectModel('LeaderBoardWeekly')
    private readonly leaderboardWeeklyModal: Model<ILeaderBoard>,
    @InjectModel('LeaderBoardSeason')
    private readonly leaderboardSeasonModal: Model<ILeaderBoard>,
    @InjectModel('Quiz')
    private readonly quizModal: Model<IQuiz>,
    private readonly analyticsService: AnalyticsService,
    private readonly accountService: AccountService,
  ) {}

  // Get the current leaderboard weekly
  async getCurrentLeaderBoard(userid: string, limit: number, page: number) {
    const dateGroup: IDateGroup = this.getWeekRange();

    const pipline = [];

    pipline.push({
      $match: {
        start_date: new Date(dateGroup.start),
        end_date: new Date(dateGroup.end),
      },
    });

    pipline.push({
      $sort: {
        points: -1,
      },
    });

    pipline.push({
      $group: {
        _id: false,
        users: {
          $push: {
            _id: '$_id',
            userid: '$userid',
            points: '$points',
            won: '$won',
          },
        },
      },
    });

    pipline.push({
      $unwind: {
        path: '$users',
        includeArrayIndex: 'ranking',
      },
    });

    pipline.push({
      $lookup: {
        from: 'users',
        localField: 'users.userid',
        foreignField: 'userid',
        as: 'info',
      },
    });

    pipline.push({
      $project: {
        _id: 0,
        users: {
          userid: 1,
          points: 1,
          won: 1,
        },
        info: {
          avatar: 1,
          username: 1,
          name: 1,
        },
        ranking: {
          $add: ['$ranking', 1],
        },
      },
    });

    pipline.push({
      $unwind: {
        path: '$info',
      },
    });

    const currUser = await this.leaderboardWeeklyModal.aggregate([
      ...pipline,
      {
        $match: {
          'users.userid': userid,
        },
      },
    ]);

    pipline.push({
      $skip: limit * page,
    });

    pipline.push({
      $limit: limit,
    });

    const all = await this.leaderboardWeeklyModal.aggregate(pipline).exec();

    return {
      currUser,
      all,
    };
  }

  async getSeasonLeaderBoard(userid: string, limit: number, page: number) {
    const dateGroup: IDateGroup = this.getSeasonRange();
    const pipline = [];

    pipline.push({
      $match: {
        start_date: new Date(dateGroup.start),
        end_date: new Date(dateGroup.end),
      },
    });

    pipline.push({
      $sort: {
        points: -1,
      },
    });

    pipline.push({
      $group: {
        _id: false,
        users: {
          $push: {
            _id: '$_id',
            userid: '$userid',
            points: '$points',
            won: '$won',
          },
        },
      },
    });

    pipline.push({
      $unwind: {
        path: '$users',
        includeArrayIndex: 'ranking',
      },
    });

    pipline.push({
      $lookup: {
        from: 'users',
        localField: 'users.userid',
        foreignField: 'userid',
        as: 'info',
      },
    });

    pipline.push({
      $project: {
        _id: 0,
        users: {
          userid: 1,
          points: 1,
          won: 1,
        },
        info: {
          avatar: 1,
          username: 1,
          name: 1,
        },
        ranking: {
          $add: ['$ranking', 1],
        },
      },
    });

    pipline.push({
      $unwind: {
        path: '$info',
      },
    });

    const currUser = await this.leaderboardSeasonModal.aggregate([
      ...pipline,
      {
        $match: {
          'users.userid': userid,
        },
      },
    ]);

    pipline.push({
      $skip: limit * page,
    });

    pipline.push({
      $limit: limit,
    });

    const all = await this.leaderboardSeasonModal.aggregate(pipline).exec();

    return {
      currUser,
      all,
    };
  }

  async getRanks(userid: string) {
    const weekGroup: IDateGroup = this.getWeekRange();
    const seasonGroup: IDateGroup = this.getSeasonRange();

    const getPipe = (dateGroup: IDateGroup) => {
      const pipline = [];
      pipline.push({
        $match: {
          start_date: new Date(dateGroup.start),
          end_date: new Date(dateGroup.end),
        },
      });

      pipline.push({
        $sort: {
          points: -1,
        },
      });

      pipline.push({
        $group: {
          _id: false,
          users: {
            $push: {
              _id: '$_id',
              userid: '$userid',
              points: '$points',
              won: '$won',
            },
          },
        },
      });

      pipline.push({
        $unwind: {
          path: '$users',
          includeArrayIndex: 'ranking',
        },
      });

      pipline.push({
        $lookup: {
          from: 'users',
          localField: 'users.userid',
          foreignField: 'userid',
          as: 'info',
        },
      });

      pipline.push({
        $project: {
          _id: 0,
          users: {
            userid: 1,
            points: 1,
            won: 1,
          },
          info: {
            avatar: 1,
            username: 1,
            name: 1,
          },
          ranking: {
            $add: ['$ranking', 1],
          },
        },
      });

      pipline.push({
        $unwind: {
          path: '$info',
        },
      });

      pipline.push({
        $match: {
          'users.userid': userid,
        },
      });

      pipline.push({
        $project: {
          ranking: 1,
        },
      });

      return pipline;
    };

    const weekRank = await this.leaderboardWeeklyModal.aggregate([
      getPipe(weekGroup),
    ]);

    const seasonRank = await this.leaderboardSeasonModal.aggregate([
      getPipe(seasonGroup),
    ]);

    const getF = (a: any[]) => (a.length > 0 ? a[0].ranking : null);

    const ranks = {
      week: getF(weekRank),
      season: getF(seasonRank),
    };

    return {
      ranks,
    };
  }

  getWeekRange(): IDateGroup {
    const start = moment()
      .utc()
      .startOf('isoWeek')
      .toISOString();

    const end = moment()
      .utc()
      .endOf('isoWeek')
      .toISOString();

    return {
      start,
      end,
    };
  }

  getSeasonRange(): IDateGroup {
    const start = moment()
      .utc()
      .startOf('quarter')
      .toISOString();
    const end = moment()
      .utc()
      .endOf('quarter')
      .toISOString();

    return {
      start,
      end,
    };
  }

  // do all stuff here after a game
  async saveLeaderBoardFromGame(
    board: UpdateLeaderBoard,
  ): Promise<{ done: boolean }> {
    // TODO: Add the points update to it's own service(account)
    const { winners, qstats } = board;
    Logger.log(`Updating leaderboard`);
    // add the coins to the users account.
    await this.accountService.blulkAddPoints(winners);

    // now handle the leaderboard
    const weekRange = this.getWeekRange();
    const seasonRange = this.getSeasonRange();

    return new Promise((resolve, rejects) => {
      this.leaderboardWeeklyModal
        .bulkWrite(
          winners.map(({ id, won_price }) => {
            return {
              updateOne: {
                filter: {
                  start_date: weekRange.start,
                  end_date: weekRange.end,
                  userid: id,
                },
                update: {
                  $inc: {
                    won: 1,
                    points: won_price,
                  },
                  $setOnInsert: {
                    userid: id,
                    start_date: weekRange.start,
                    end_date: weekRange.end,
                  },
                },
                upsert: true,
              },
            };
          }),
        )
        .then(() => {
          this.leaderboardSeasonModal
            .bulkWrite(
              winners.map(({ id, won_price }) => {
                return {
                  updateOne: {
                    filter: {
                      start_date: seasonRange.start,
                      end_date: seasonRange.end,
                      userid: id,
                    },
                    update: {
                      $inc: {
                        won: 1,
                        points: won_price,
                      },
                      $setOnInsert: {
                        userid: id,
                        start_date: seasonRange.start,
                        end_date: seasonRange.end,
                      },
                    },
                    upsert: true,
                  },
                };
              }),
            )
            .then(async () => {
              if (qstats.length > 0) {
                await this.analyticsService.updateQuestionStats(qstats);
              }
              await this.analyticsService.updateAnalytics(board);
              resolve({ done: true });
            })
            .catch(err => {
              Logger.log(err.toString());
              rejects({
                done: false,
              });
            });
        })
        .catch(err => {
          Logger.log(err.toString());
          rejects({
            done: false,
          });
        });
    });
  }
}
