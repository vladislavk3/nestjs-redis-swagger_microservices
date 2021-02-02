import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { AccountSchema, Role } from 'knowin/common';
import { UsersModule } from '../users/users.module';
import { QuestionModule } from '../question/question.module';
import { NotificationModule } from '../notification/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AuthRequest } from '../jwt.middleware';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';

describe('AccountController', () => {
  let controller: AccountController;
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
        ]),
        UsersModule,
        QuestionModule,
        NotificationModule,
        AnalyticsModule,
      ],
      controllers: [AccountController],
      providers: [AccountService],
    }).compile();

    controller = module.get<AccountController>(AccountController);
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

  // @ts-ignore
  let modUserRequest: AuthRequest = {
    user: {
      userid: 'mod-id',
      role: Role.moderator,
      status: 'active',
    },
  };

  // @ts-ignore
  let normalUserRequest: AuthRequest = {
    user: {
      userid: 'normal-id',
      role: Role.user,
      status: 'active',
    },
  };

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  it('getAccount()', async () => {
    // Insert
    const accDb = conn.collection('accounts');
    await accDb.insertOne({
      points: 6.67,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'admin-id',
      referal_completed: true,
    });

    const result = await controller.getAccount(adminUserRequest);

    expect(result).toStrictEqual({
      status: true,
      statusCode: 'M_OK',
      data: {
        points: 6.67,
        iban_no: '',
        joinedgames: [],
        wongames: [],
        playedgames: [],
        userid: 'admin-id',
        referal_completed: true,
      },
    });
  });

  it('getPoints()', async () => {
    // insert
    const accDb = conn.collection('accounts');
    await accDb.insertOne({
      points: 1000,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'normal-id',
      referal_completed: true,
    });

    await accDb.insertOne({
      points: 5000,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'mod-id',
      referal_completed: true,
    });

    await accDb.insertOne({
      points: 11.11,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'admin-id',
      referal_completed: true,
    });

    const normalRes = await controller.getPoints(normalUserRequest);
    const modRes = await controller.getPoints(modUserRequest);
    const adminRes = await controller.getPoints(adminUserRequest);

    expect(normalRes).toStrictEqual({
      status: true,
      data: {
        points: 1000,
      },
      statusCode: 'M_OK',
    });

    expect(modRes).toStrictEqual({
      status: true,
      data: {
        points: 5000,
      },
      statusCode: 'M_OK',
    });

    expect(adminRes).toStrictEqual({
      status: true,
      data: {
        points: 11.11,
      },
      statusCode: 'M_OK',
    });
  });

  it('getInfo()', async () => {
    const accDb = conn.collection('accounts');
    const _id = mongoose.Types.ObjectId();
    await accDb.insertOne({
      points: 1000,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'normal-id',
      referal_completed: true,
      _id,
    });

    let fields = 'points,userid';
    const result = await controller.getInfo(normalUserRequest, fields);

    expect(result).toStrictEqual({
      status: true,
      statusCode: 'M_DONE',
      data: {
        userid: 'normal-id',
        points: 1000,
        _id,
      },
    });
  });

  it('addInfo() // update iban_no', async () => {
    let iban_no = 'myIbanNo';
    const accDb = conn.collection('accounts');
    await accDb.insertOne({
      points: 1000,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'normal-id',
      referal_completed: true,
    });

    const res = await controller.addInfo(normalUserRequest, iban_no);

    expect(res).toStrictEqual({
      status: true,
      statusCode: 'M_DONE',
      data: {},
    });

    const doc = await accDb.findOne({ userid: 'normal-id' });

    expect(doc.iban_no).toBe(iban_no);
  });
});
