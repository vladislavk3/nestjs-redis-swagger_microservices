import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';
import validator from 'validator';

import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { UserSchema, ProductsSchema, AccountSchema } from 'knowin/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { OtpSchema } from './schemas/otp.schema';
import { PasswordUtil } from './auth.utils';
import { AuthLimiter } from './auth.limiter';
import { JwtModule } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let conn: mongoose.Connection;
  let mobile = '+905532850053';

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'helloworld',
          signOptions: {
            expiresIn: '60 days',
          },
        }),
        DbModule({
          useUnifiedTopology: true,
          useNewUrlParser: true,
          useCreateIndex: true,
          useFindAndModify: false,
          connectionName: (new Date().getTime() * Math.random()).toString(16),
        }),
        MongooseModule.forFeature([
          {
            name: 'Users',
            schema: UserSchema,
          },
          {
            name: 'Otp',
            schema: OtpSchema,
          },
          {
            name: 'Products',
            schema: ProductsSchema,
          },
          {
            name: 'Account',
            schema: AccountSchema,
          },
        ]),
      ],
      controllers: [AuthController],
      providers: [AuthService, PasswordUtil, AuthLimiter],
    }).compile();

    service = module.get<AuthService>(AuthService);
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

  describe('optSeq()', () => {
    it('should return a otp', async () => {
      const otp = await service.otpSeq(mobile, 'en');
      expect(typeof otp).toBe('number');
      expect(otp).toBeDefined();
    });

    it('should return a otp', async () => {
      const otp = await service.otpSeq(mobile, 'en');
      expect(typeof otp).toBe('number');
      expect(otp).toBeDefined();
    });

    it('should send a message', async () => {
      process.env.KNOWIN_ENV = 'production';

      const otp = await service.otpSeq(mobile, 'en');

      jest
        .spyOn(service, 'sendOtpToMobile')
        .mockImplementation((mobile, otp, lang) => {
          expect(mobile).toBe(mobile);
          expect(otp).toBeDefined();
          expect(typeof otp).toBe('number');
          expect(lang).toBe('en');
        });

      expect(typeof otp).toBe('number');
      expect(otp).toBeDefined();
    });
  });

  describe('verifyOtpAndGenToken()', () => {
    it('Fake otp and no', async () => {
      const res = await service.verifyOtpAndGenToken(123456, mobile);
      expect(res.verify).toBe(false);
    });

    it('Should create a user', async () => {
      process.env.KNOWIN_ENV = 'development';

      const otp = await service.otpSeq(mobile, 'en');
      const res = await service.verifyOtpAndGenToken(otp, mobile);

      expect(res.verify).toBe(true);
    });
  });

  it('genJwt()', () => {
    _.times(10, async () => {
      const jwt = await service.genJwt({
        hello: 'hello',
      });
      const isJwt = validator.isJWT(jwt);
      expect(isJwt).toBe(true);
    });
  });

  it('genrateOtp()', () => {
    let arr = [];
    _.times(10, async () => {
      const otp = service.genrateOtp();
      expect(typeof otp).toBe('number');
      expect(String(otp).length).toBe(6);
      expect(arr.includes(otp)).toBe(false);
      arr.push(otp);
    });
  });

  describe('setNewPassword()', () => {
    it('No user found', async () => {
      const res = await service.setNewPassword('sun', 'helloworld', 'hello');
      expect(res.verify).toBe(false);
    });

    it('user is a admin change the pass but gives wrong password', async () => {
      const db = conn.collection('users');
      await db.insertOne({
        role: 'admin',
        status: 'active',
        fcm_token: '',
        password_set: true,
        userid: 'sun',
        mobile: '+905532850053',
        referal_code: 'RQc6Fj',
        createdAt: '2020-05-20T15:09:18.748Z',
        updatedAt: '2020-05-20T15:11:04.789Z',
        dob: '15/03/1991',
        gender: 'female',
        name: 'arife',
        username: 'arife',
        referal_by: 'j6UZcg',
        hash: '$2b$10$CGCeyVZbFQTHZrq2X6o13eZtFH7ZHcmMpmKo/aofg8ts6NV0kHiXK',
        avatar:
          'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
      });
      const res = await service.setNewPassword('sun', 'helloworld', 'hello1');
      expect(res.verify).toBe(false);
    });

    it('user is a admin change the pass gives right password', async () => {
      const db = conn.collection('users');
      await db.insertOne({
        role: 'admin',
        status: 'active',
        fcm_token: '',
        password_set: true,
        userid: 'sun',
        mobile: '+905532850053',
        referal_code: 'RQc6Fj',
        createdAt: '2020-05-20T15:09:18.748Z',
        updatedAt: '2020-05-20T15:11:04.789Z',
        dob: '15/03/1991',
        gender: 'female',
        name: 'arife',
        username: 'arife',
        referal_by: 'j6UZcg',
        hash: '$2b$10$CGCeyVZbFQTHZrq2X6o13eZtFH7ZHcmMpmKo/aofg8ts6NV0kHiXK',
        avatar:
          'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
      });
      const res = await service.setNewPassword('sun', 'helloworld', 'hello');
      expect(res.verify).toBe(true);
    });
  });

  describe('verifyOtpAndGenTokenDash()', () => {
    it('Wrong pass', async () => {
      const res = await service.verifyOtpAndGenTokenDash(
        123456,
        'helllo',
        mobile,
      );
      expect(res.verify).toBe(false);
    });

    it('correct pass', async () => {
      process.env.KNOWIN_ENV = 'development';
      const db = conn.collection('users');
      await db.insertOne({
        role: 'admin',
        status: 'active',
        fcm_token: '',
        password_set: true,
        userid: 'sun',
        mobile: '+905532850053',
        referal_code: 'RQc6Fj',
        createdAt: '2020-05-20T15:09:18.748Z',
        updatedAt: '2020-05-20T15:11:04.789Z',
        dob: '15/03/1991',
        gender: 'female',
        name: 'arife',
        username: 'arife',
        referal_by: 'j6UZcg',
        hash: '$2b$10$CGCeyVZbFQTHZrq2X6o13eZtFH7ZHcmMpmKo/aofg8ts6NV0kHiXK',
        avatar:
          'https://knowin.s3.amazonaws.com/6ac01bc3-66bb-47d9-8c1f-52327fc005af',
      });
      const otp = await service.otpSeq(mobile, 'en');
      const res = await service.verifyOtpAndGenTokenDash(otp, 'hello', mobile);
      expect(res.verify).toBe(true);
    });
  });

  it('genReferalCode()', () => {
    let arr = [];
    _.times(10, async () => {
      const code = service.genReferalCode(Math.random().toString());
      expect(String(code).length).toBe(6);
      expect(arr.includes(code)).toBe(false);
      arr.push(code);
    });
  });
});
