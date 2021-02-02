import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { PromotionsController } from './promotions.controller';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { AuthRequest } from '../jwt.middleware';
import { Role, SpinWinSchema, SpinWinType } from 'knowin/common';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { PromotionsService } from './promotions.service';

xdescribe('PromotionsController', () => {
  let controller: PromotionsController;
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
            name: 'Spinwin',
            schema: SpinWinSchema,
          },
        ]),
      ],
      controllers: [PromotionsController],
      providers: [PromotionsService],
    }).compile();

    controller = module.get<PromotionsController>(PromotionsController);
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

  it('getResult() // No data on user', async () => {
    const result = await controller.getResult(
      adminUserRequest,
      SpinWinType.vip,
    );
    expect(result).toStrictEqual({
      status: false,
      statusCode: 'M_TRY_AGAIN',
      data: {},
    });
  });

  it('getResult() // Data on user but less then 10 games', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'admin-id',
      gamePlayed: 7,
      type: SpinWinType.regular,
    });

    const result = await controller.getResult(
      adminUserRequest,
      SpinWinType.regular,
    );
    expect(result).toStrictEqual({
      status: false,
      statusCode: 'M_TRY_AGAIN',
      data: {},
    });
  });

  it('getResult() // Data on user but more then 10 games', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'admin-id',
      gamePlayed: 11,
      type: SpinWinType.regular,
    });

    const result = await controller.getResult(
      adminUserRequest,
      SpinWinType.regular,
    );
    expect(result.status).toBe(true);
    expect(result.statusCode).toBe('M_DONE');
    // @ts-ignore
    expect(result.data.result).toBeDefined();
    // @ts-ignore
    expect(result.data.options).toBeDefined();

    const doc = await db.findOne({ userid: 'admin-id' });
    expect(doc.userid).toBe('admin-id');
    expect(doc.gamePlayed).toBe(1);
  });

  it('checkEligibility() // No data', async () => {
    const result = await controller.checkEligibility(
      adminUserRequest,
      SpinWinType.vip,
    );
    expect(result).toStrictEqual({
      status: true,
      statusCode: 'M_DONE',
      data: {
        eligible: false,
        gamePlayed: 0,
      },
    });
  });

  it('checkEligibility() // less data', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'admin-id',
      gamePlayed: 9,
      type: SpinWinType.vip,
    });
    const result = await controller.checkEligibility(
      adminUserRequest,
      SpinWinType.vip,
    );
    expect(result).toStrictEqual({
      status: true,
      statusCode: 'M_DONE',
      data: {
        eligible: false,
        gamePlayed: 9,
      },
    });
  });

  it('checkEligibility() // full data', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'admin-id',
      gamePlayed: 11,
      type: SpinWinType.regular,
    });
    const result = await controller.checkEligibility(
      adminUserRequest,
      SpinWinType.regular,
    );
    expect(result).toStrictEqual({
      status: true,
      statusCode: 'M_DONE',
      data: {
        eligible: true,
        gamePlayed: 11,
      },
    });
  });
});
