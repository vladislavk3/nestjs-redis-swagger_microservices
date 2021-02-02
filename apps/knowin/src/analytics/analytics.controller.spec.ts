import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as moment from 'moment';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { AnalyticsSchema } from 'knowin/common';
import { AccountSchema, Role } from 'knowin/common';
import { QuestionModule } from '../question/question.module';
import { AuthRequest } from '../jwt.middleware';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';

describe('AnalyticsController', () => {
  let controller: AnalyticsController;
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

    controller = module.get<AnalyticsController>(AnalyticsController);
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

  // mock request
  // @ts-ignore
  let adminUserRequest: AuthRequest = {
    user: {
      userid: 'admin-id',
      role: Role.admin,
      status: 'active',
    },
  };

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  describe('getGraph()', () => {
    it('has no data', async () => {
      const graph = await controller.getGraph(adminUserRequest);
      expect(graph).toStrictEqual({
        status: true,
        statusCode: 'M_OK',
        data: [],
      });
    });

    it('has data', async () => {
      // add a quiz
      const quizDb = conn.collection('quizzes');
      await quizDb.insertOne({
        questionlist: [
          '2aa43f72-7b5f-41ed-b252-30d8da077953',
          '830ea83d-28b6-4d47-8f33-522ac38f6f71',
          'dcf9ba2e-4cea-4931-a15b-c8a6447d59db',
          '6d69f851-bf54-4196-aba2-7b1fc015fdd6',
          'aeab78cd-5146-4c4c-96b6-d3f98f50ee3d',
          '1a1ad518-802f-4fae-b297-b7faafcd9767',
          'f4418ae5-9ab5-4d4c-a6e2-0e4046ed3652',
          'f3622268-c0ee-4ff3-8e1d-19fc8fb7fec2',
          '4cdb5b8c-a167-40a5-bfe8-9166a5dca693',
          'a861e622-a421-4685-8a75-0206bbefe6d7',
        ],
        joinedusers: ['aceed19f-3d1b-4b9a-96c3-d0cb6bc45e72'],
        reward_type: 'game_win',
        status: 'finished',
        starttime: '2020-07-13T09:46:46.201Z',
        roomsize: 1,
        winningprice: 1,
        entryfee: 1,
        category: 'genel kültür',
        quizid: '6dbadbac-6949-4fa0-bc17-edf6dadc5e73',
        banner:
          'https://knowin.s3.amazonaws.com/quiz-banner/034b8ed2-7e01-43c0-be2e-41363914a834',
      });

      // Update analytics
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

      const graph = await controller.getGraph(adminUserRequest);

      expect(graph.status).toBe(true);
      expect(graph.statusCode).toBe('M_OK');
      const dateValid = moment(graph.data[0].date, moment.ISO_8601).isValid();
      expect(dateValid).toBe(true);
      expect(graph.data[0].points).toBe(2000);
    });
  });

  describe('getPointsStats()', () => {
    it('Sould return point stats (Without any data)', async () => {
      const res = await controller.getPointsStats(adminUserRequest);

      expect(res).toStrictEqual({
        status: true,
        statusCode: 'M_OK',
        data: {
          current_earn: 0,
          current_points: 0,
          total_earn: 0,
          total_points: 0,
        },
      });
    });

    it('Sould return point stats (With data)', async () => {
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
      const res = await controller.getPointsStats(adminUserRequest);
      expect(res).toStrictEqual({
        status: true,
        statusCode: 'M_OK',
        data: {
          current_earn: 6,
          current_points: 600,
          total_earn: 6,
          total_points: 600,
        },
      });
    });
  });
});
