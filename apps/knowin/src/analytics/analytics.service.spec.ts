import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { AnalyticsSchema } from 'knowin/common';
import { AccountSchema } from 'knowin/common';
import { QuestionModule } from '../question/question.module';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { UpdateLeaderBoard } from '../leaderboard/dto/update-leaderboard.dto';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
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
            name: 'Account',
            schema: AccountSchema,
          },
          {
            name: 'Analytics',
            schema: AnalyticsSchema,
          },
        ]),
        QuestionModule,
      ],
      controllers: [AnalyticsController],
      providers: [AnalyticsService],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
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
    expect(service).toBeDefined();
  });

  describe('getPointsStats()', () => {
    it('no data', async () => {
      const res = await service.getPointsStats('admin-id');

      expect(res).toStrictEqual({
        current_earn: 0,
        current_points: 0,
        total_earn: 0,
        total_points: 0,
      });
    });

    it('data', async () => {
      await service.updateAnalytics({
        quizid: '6dbadbac-6949-4fa0-bc17-edf6dadc5e73',
        qstats: [],
        winners: [
          {
            id: 'admin-id',
            won_price: 500,
          },
        ],
      });
      const accDb = conn.collection('accounts');
      await accDb.insertOne({
        points: 500,
        iban_no: '',
        joinedgames: [],
        wongames: [],
        playedgames: [],
        userid: 'admin-id',
        referal_completed: true,
      });

      await service.updateAnalytics({
        quizid: '6dbadbac-6949-4fa0-bc17-edf6dadc5e73',
        qstats: [],
        winners: [
          {
            id: 'admin-id',
            won_price: 100,
          },
        ],
      });

      await accDb.updateOne(
        {
          userid: 'admin-id',
        },
        {
          $inc: {
            points: 100,
          },
        },
      );
      const res = await service.getPointsStats('admin-id');

      expect(res).toStrictEqual({
        current_earn: 6,
        current_points: 600,
        total_earn: 6,
        total_points: 600,
      });
    });
  });

  it('getGraph()', async () => {
    await service.updateAnalytics({
      quizid: '6dbadbac-6949-4fa0-bc17-edf6dadc5e73',
      qstats: [],
      winners: [
        {
          id: 'admin-id',
          won_price: 2000,
        },
        {
          id: 'user-2',
          won_price: 2000,
        },
      ],
    });

    const res = await service.getGraph('admin-id');
    expect(moment(res[0].date, moment.ISO_8601).isValid()).toBe(true);
    expect(res[0].points).toBe(2000);
  });

  it('updateQuestionStats()', async () => {
    // add questions
    const qDb = conn.collection('questions');
    await qDb.insertOne({
      level: 'practice',
      tags: [],
      win: 0,
      played: 0,
      title: 'Question No 1.',
      options: [
        {
          key: 1,
          value: '1',
        },
        {
          key: 2,
          value: '2',
        },
        {
          key: 3,
          value: '3',
        },
        {
          key: 4,
          value: '4',
        },
      ],
      answerKey: 1,
      questionid: 'qid-1',
    });

    await qDb.insertOne({
      level: 'practice',
      tags: [],
      win: 0,
      played: 1,
      title: 'Question No 2.',
      options: [
        {
          key: 1,
          value: '1',
        },
        {
          key: 2,
          value: '2',
        },
        {
          key: 3,
          value: '3',
        },
        {
          key: 4,
          value: '4',
        },
      ],
      answerKey: 1,
      questionid: 'qid-2',
    });

    await service.updateQuestionStats([
      {
        questionId: 'qid-1',
        wrong: 8,
        correct: 2,
      },
      {
        questionId: 'qid-2',
        wrong: 5,
        correct: 5,
      },
    ]);

    const q1 = await qDb.findOne({ questionid: 'qid-1' });
    const q2 = await qDb.findOne({ questionid: 'qid-2' });

    expect(q1.played).toBe(10);
    expect(q2.played).toBe(11);

    expect(q1.win).toBe(2);
    expect(q2.win).toBe(5);
  });

  it('updateQuestionStatsByOne()', async () => {
    const qDb = conn.collection('questions');
    await qDb.insertOne({
      level: 'practice',
      tags: [],
      win: 0,
      played: 0,
      title: 'Question No 1.',
      options: [
        {
          key: 1,
          value: '1',
        },
        {
          key: 2,
          value: '2',
        },
        {
          key: 3,
          value: '3',
        },
        {
          key: 4,
          value: '4',
        },
      ],
      answerKey: 1,
      questionid: 'qid-1',
    });

    await qDb.insertOne({
      level: 'practice',
      tags: [],
      win: 0,
      played: 1,
      title: 'Question No 2.',
      options: [
        {
          key: 1,
          value: '1',
        },
        {
          key: 2,
          value: '2',
        },
        {
          key: 3,
          value: '3',
        },
        {
          key: 4,
          value: '4',
        },
      ],
      answerKey: 1,
      questionid: 'qid-2',
    });
    await service.updateQuestionStatsByOne(['qid-1', 'qid-2']);

    const q1 = await qDb.findOne({ questionid: 'qid-1' });
    const q2 = await qDb.findOne({ questionid: 'qid-2' });

    expect(q1.played).toBe(1);
    expect(q2.played).toBe(2);
  });

  it('updateAnalytics()', async () => {
    const board: UpdateLeaderBoard = {
      qstats: [],
      winners: [
        {
          id: 'userid-1',
          won_price: 20,
        },
        {
          id: 'userid-2',
          won_price: 40,
        },
      ],
      quizid: '',
    };

    const board2: UpdateLeaderBoard = {
      qstats: [],
      winners: [
        {
          id: 'userid-1',
          won_price: 50,
        },
      ],
      quizid: '',
    };

    await service.updateAnalytics(board);
    await service.updateAnalytics(board2);

    const db = conn.collection('analytics');

    const user1 = await db.findOne({ userid: 'userid-1' });
    const user2 = await db.findOne({ userid: 'userid-2' });

    expect(user1.points_won[0].points).toBe(20);
    expect(user1.total_earned).toBe(70);
    expect(user2.points_won[0].points).toBe(40);
    expect(user2.total_earned).toBe(40);
  });
});
