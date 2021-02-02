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
import { NotificationService } from '../notification/notification.service';

describe('AccountService', () => {
  let service: AccountService;
  let notification: NotificationService;
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

    service = module.get<AccountService>(AccountService);
    notification = module.get<NotificationService>(NotificationService);
    conn = module.get(getConnectionToken());
  });

  afterAll(async () => {
    await conn.close();
    await closeMongoConnection();
  });

  afterEach(async () => {
    await conn.dropDatabase();
  });

  it('getAccountInfo()', async () => {
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

    const res = await service.getAccountInfo('admin-id');

    expect(res.toJSON()).toStrictEqual({
      points: 6.67,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'admin-id',
      referal_completed: true,
    });
  });

  it('getAccountInfoV2()', async () => {
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

    const res = await service.getAccountInfoV2(
      'admin-id',
      'points userid -_id',
    );

    expect(res.toJSON()).toStrictEqual({
      points: 6.67,
      userid: 'admin-id',
    });
  });

  it('getAccountPoints()', async () => {
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

    const res = await service.getAccountPoints('admin-id');

    expect(res.toJSON()).toStrictEqual({
      points: 6.67,
    });
  });

  it('addInfo()', async () => {
    const accDb = conn.collection('accounts');
    const iban_no = 'helloworld';
    await accDb.insertOne({
      points: 6.67,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'admin-id',
      referal_completed: true,
    });

    await service.addInfo({
      userid: 'admin-id',
      iban_no,
    });

    const doc = await accDb.findOne({ userid: 'admin-id' });
    expect(doc.iban_no).toBe(iban_no);
  });

  it('updatePointsOnReferalCompleted()', async () => {
    const accDb = conn.collection('accounts');
    const usersDb = conn.collection('users');

    // User A referal
    await usersDb.insertOne({
      role: 'user',
      status: 'active',
      fcm_token: 'fcm_token',
      password_set: false,
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
      mobile: '+905532850053',
      referal_code: 'RQc6Fj',
      createdAt: '2020-05-20T15:09:18.748Z',
      updatedAt: '2020-05-20T15:11:04.789Z',
      dob: '15/03/1991',
      gender: 'female',
      name: 'arife',
      username: 'arife',
      avatar:
        'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    await accDb.insertOne({
      points: 0,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    // User B referent
    await usersDb.insertOne({
      role: 'user',
      status: 'active',
      fcm_token: 'fcm_token',
      password_set: false,
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
      mobile: '+905426369178',
      referal_code: 'Decqup',
      createdAt: '2020-05-20T15:09:18.748Z',
      updatedAt: '2020-05-20T15:11:04.789Z',
      dob: '15/03/1991',
      gender: 'others',
      name: 'Jaycee Feil Jr.',
      username: 'Branson_Willms19',
      referal_by: 'RQc6Fj',
      avatar:
        'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    await accDb.insertOne({
      points: 1000,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
      referal_completed: false,
    });

    jest
      .spyOn(notification, 'sendWithL')
      .mockImplementation((token: any[], _: any) => {
        token.forEach(({ fcm_token }) => {
          expect(fcm_token).toBe('fcm_token');
        });
        return new Promise(() => {});
      });

    await service.updatePointsOnReferalCompleted();

    const referant = await accDb.findOne({
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    expect(referant.points).toBe(100);

    const referal = await accDb.findOne({
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
    });

    expect(referal.referal_completed).toBe(true);
  });

  it('blulkAddPoints()', async () => {
    const accDb = conn.collection('accounts');
    const usersDb = conn.collection('users');

    // User A referal
    await usersDb.insertOne({
      role: 'user',
      status: 'active',
      fcm_token: 'fcm_token',
      password_set: false,
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
      mobile: '+905532850053',
      referal_code: 'RQc6Fj',
      createdAt: '2020-05-20T15:09:18.748Z',
      updatedAt: '2020-05-20T15:11:04.789Z',
      dob: '15/03/1991',
      gender: 'female',
      name: 'arife',
      username: 'arife',
      avatar:
        'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    await accDb.insertOne({
      points: 0,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    // User B referent
    await usersDb.insertOne({
      role: 'user',
      status: 'active',
      fcm_token: 'fcm_token',
      password_set: false,
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
      mobile: '+905426369178',
      referal_code: 'Decqup',
      createdAt: '2020-05-20T15:09:18.748Z',
      updatedAt: '2020-05-20T15:11:04.789Z',
      dob: '15/03/1991',
      gender: 'others',
      name: 'Jaycee Feil Jr.',
      username: 'Branson_Willms19',
      referal_by: 'RQc6Fj',
      avatar:
        'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    await accDb.insertOne({
      points: 0,
      iban_no: '',
      joinedgames: [],
      wongames: [],
      playedgames: [],
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
      referal_completed: true,
    });

    await service.blulkAddPoints([
      {
        id: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
        won_price: 1000,
      },
      {
        id: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
        won_price: 500,
      },
    ]);

    const user1 = await accDb.findOne({
      userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
    });

    expect(user1.points).toBe(1000);

    const user2 = await accDb.findOne({
      userid: 'd83a67a3-848f-4e6f-b029-c6e410ee6fd3',
    });

    expect(user2.points).toBe(500);
  });
});
