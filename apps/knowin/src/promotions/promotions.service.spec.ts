import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import { PromotionsController } from './promotions.controller';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { SpinWinSchema, SpinWinType } from 'knowin/common';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { PromotionsService } from './promotions.service';

xdescribe('PromotionsService', () => {
  let service: PromotionsService;
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

    service = module.get<PromotionsService>(PromotionsService);
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

  it('after10GameSpinResults() should throw error', async () => {
    try {
      await service.after10GameSpinResults('lalala', SpinWinType.vip);
      expect(true).toBe(false);
    } catch (error) {
      expect(error.toString()).toBe('Error: Not Eligible');
    }
  });

  it('after10GameSpinResults() should return something', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'suraj',
      gamePlayed: 13,
      type: SpinWinType.vip,
    });

    const res = await service.after10GameSpinResults('suraj', SpinWinType.vip);
    expect(res.result).toBeDefined();

    const doc = await db.findOne({ userid: 'suraj' });
    expect(doc.userid).toBe('suraj');
    expect(doc.gamePlayed).toBe(3);
  });

  it('decGameCount() by 10', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'suraj',
      gamePlayed: 13,
      type: SpinWinType.vip,
    });

    await service.decGameCount('suraj', 10, SpinWinType.vip);
    const doc = await db.findOne({ userid: 'suraj', type: SpinWinType.vip });
    expect(doc.userid).toBe('suraj');
    expect(doc.gamePlayed).toBe(3);
  });

  it('decGameCount() by 5', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'suraj',
      gamePlayed: 10,
      type: SpinWinType.regular,
    });

    await service.decGameCount('suraj', 5, SpinWinType.regular);
    const doc = await db.findOne({
      userid: 'suraj',
      type: SpinWinType.regular,
    });
    expect(doc.userid).toBe('suraj');
    expect(doc.gamePlayed).toBe(5);
  });

  it('checkEligibility() true', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'suraj',
      gamePlayed: 10,
      type: SpinWinType.vip,
    });

    const res = await service.checkEligibility('suraj', SpinWinType.vip);
    expect(res.eligible).toBe(true);
    expect(res.gamePlayed).toBe(10);
  });

  it('checkEligibility() false', async () => {
    const db = conn.collection('spinwins');
    await db.insertOne({
      userid: 'suraj',
      gamePlayed: 8,
      type: SpinWinType.regular,
    });

    const res = await service.checkEligibility('suraj', SpinWinType.regular);
    expect(res.eligible).toBe(false);
    expect(res.gamePlayed).toBe(8);
  });
});
