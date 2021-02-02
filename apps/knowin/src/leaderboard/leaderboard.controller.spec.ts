import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';

import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { UserSchema, QuizSchema, Role } from 'knowin/common';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderBoardWeeklySchema } from './schemas/leaderboard-weekly.schema';
import { LeaderBoardSeasonSchema } from './schemas/leaderboard-season.schema';
import { LeaderboardService } from './leaderboard.service';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AccountModule } from '../account/account.module';
import { UsersModule } from '../users/users.module';
import { NotificationModule } from '../notification/notifications.module';
import { AuthRequest } from '../jwt.middleware';

describe('AuthController', () => {
  let controller: LeaderboardController;
  let service: LeaderboardService;
  let conn: mongoose.Connection;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        DbModule({
          useUnifiedTopology: true,
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          {
            name: 'LeaderBoardWeekly',
            schema: LeaderBoardWeeklySchema,
          },
          {
            name: 'LeaderBoardSeason',
            schema: LeaderBoardSeasonSchema,
          },
          {
            name: 'Quiz',
            schema: QuizSchema,
          },
          {
            name: 'Users',
            schema: UserSchema,
          },
        ]),
        AnalyticsModule,
        AccountModule,
        UsersModule,
        NotificationModule,
      ],
      controllers: [LeaderboardController],
      providers: [LeaderboardService],
    }).compile();

    controller = module.get<LeaderboardController>(LeaderboardController);
    service = module.get<LeaderboardService>(LeaderboardService);
    conn = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await conn.close();
    await closeMongoConnection();
  });

  afterEach(async () => {
    await conn.dropDatabase();
  });

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  // Defaults
  // @ts-ignore
  let req: AuthRequest = {
    user: {
      userid: 'user1',
      role: Role.user,
      status: 'active',
    },
    headers: {
      authorization: 'lol',
    },
  };
  let limit = 10;
  let page = 1;

  describe('getLeaderBoard()', () => {
    it('should return empty leaderboard', async () => {
      const result = await controller.getLeaderBoard(req, limit, page);

      console.log(result);
      expect(result).toStrictEqual({
        status: true,
        statusCode: 'M_OK',
        data: {
          all: [],
          currUser: [],
        },
      });
    });

    it('should return users in leaderboard', async () => {
      // Update leaderboard
      let winners = [
        {
          id: 'user1',
          won_price: 1000,
        },
        {
          id: 'user2',
          won_price: 100,
        },
        {
          id: 'user3',
          won_price: 100,
        },
      ];
      let qstats = [];
      const { done } = await service.saveLeaderBoardFromGame({
        winners,
        qstats,
        quizid: 'fake-quiz',
      });
      expect(done).toBe(true);
      const leaderboard = await controller.getLeaderBoard(req, limit, page);
      expect(leaderboard).toStrictEqual({
        status: true,
        statusCode: 'M_OK',
        data: {
          all: [],
          currUser: [],
        },
      });
    });
  });

  describe('getLeaderBoardSeason()', () => {
    it('Should get season Leaderboard Empty', () => {
      expect(true).toBe(true);
    });

    it('Should get season Leaderboard with data', () => {
      expect(true).toBe(true);
    });
  });

  describe('getRank()', () => {
    it('Should get user rank [NO data]', () => {
      expect(true).toBe(true);
    });

    it('Should get user data', () => {
      expect(true).toBe(true);
    });
  });

  it('setLeaderBoard() Should update leaderboard', () => {
    expect(true).toBe(true);
  });

  it('validate() [Correct token]', () => {
    process.env.API_ACCESS_TOKEN_MAIN = 'lol';
    const isTrue = controller.validate(req);
    expect(isTrue).toBe(true);
  });

  it('validate() [Wrong token]', () => {
    process.env.API_ACCESS_TOKEN_MAIN = 'lol1';
    const isTrue = controller.validate(req);
    expect(isTrue).toBe(false);
  });
});
