import { Test, TestingModule } from '@nestjs/testing';
import * as mongoose from 'mongoose';
import * as _ from 'lodash';

import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Role, UserSchema, ProductsSchema, AccountSchema } from 'knowin/common';
import { AuthRequest } from '../jwt.middleware';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import DbModule, { closeMongoConnection } from '../../test/db-test.module';
import { OtpSchema } from './schemas/otp.schema';
import { PasswordUtil } from './auth.utils';
import { AuthLimiter } from './auth.limiter';
import { JwtModule } from '@nestjs/jwt';
import validate from 'validator';

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;
  let limiter: AuthLimiter;
  let conn: mongoose.Connection;

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

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
    limiter = module.get<AuthLimiter>(AuthLimiter);
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
  let authUser: AuthRequest = {
    user: {
      userid: 'admin-id',
      role: Role.admin,
      status: 'active',
    },
    headers: {
      'x-forwarded-for': '1.1.1.1',
    },
    query: {
      lang: 'en',
    },
  };

  it('should be defined', async () => {
    expect(controller).toBeDefined();
  });

  describe('login()', () => {
    it('when a mobile no is wrong', async () => {
      const mobileNos = [
        '123423',
        '2345-2345-234',
        '+0194983',
        '+21312',
        '8929289489',
      ];

      mobileNos.forEach(async mobile => {
        const res = await controller.login(authUser, mobile);
        expect(res).toStrictEqual({
          status: false,
          statusCode: 'M_A2',
          data: {
            mobile,
          },
        });
      });
    });

    it('After 5 request ip should be blocked', async () => {
      process.env.KNOWIN_ENV = 'production';

      // TODO: Mock near real redis insted of this
      jest.spyOn(limiter, 'check').mockImplementation(() => {
        return new Promise(a => {
          a({
            allowed: false,
            tryAfter: 100,
            attempt: 1,
          });
        });
      });

      _.times(6, async () => {
        await controller.login(authUser, '+905532850053');
      });

      const res = await controller.login(authUser, '+905532850053');

      expect(res.status).toBe(false);
      expect(res.statusCode).toBe('M_LIMIT_EXCEEDED');
    });

    it('Should follow login seq', async () => {
      process.env.KNOWIN_ENV = 'production';

      // TODO: Mock near real redis insted of this
      jest.spyOn(limiter, 'check').mockImplementation(() => {
        return new Promise(a => {
          a({
            allowed: true,
            tryAfter: 100,
            attempt: 1,
          });
        });
      });

      jest
        .spyOn(service, 'sendOtpToMobile')
        .mockImplementation((mobile, otp, lang) => {
          expect(mobile).toBe('+905532850053');
          expect(otp).toBeDefined();
          expect(typeof otp).toBe('number');
          expect(lang).toBe('en');
        });

      const res = await controller.login(authUser, '+905532850053');

      expect(res.status).toBe(true);
      expect(res.statusCode).toBe('M_A1');
      expect(res.data.mobile).toBe('+905532850053');
    });

    it('Should follow login seq // in dev', async () => {
      process.env.KNOWIN_ENV = 'development';

      const res = await controller.login(authUser, '+905532850053');

      expect(res.status).toBe(true);
      expect(res.statusCode).toBe('M_A1');
      expect(res.data.mobile).toBe('+905532850053');
      expect(res.data.otp).toBeDefined();
      expect(typeof res.data.otp).toBe('number');
    });
  });

  describe('verify()', () => {
    it('should not verify the user', async () => {
      const res = await controller.verify(344532, '+905532850053');

      expect(res.status).toBe(false);
      expect(res.statusCode).toBe('M_A4');
    });

    it('should get a token and userinfo for new user', async () => {
      process.env.KNOWIN_ENV = 'development';
      const res = await controller.login(authUser, '+905532850053');

      expect(res.status).toBe(true);
      expect(res.statusCode).toBe('M_A1');
      expect(res.data.mobile).toBe('+905532850053');
      expect(res.data.otp).toBeDefined();
      expect(typeof res.data.otp).toBe('number');

      const res2 = await controller.verify(res.data.otp, '+905532850053');

      expect(res2.status).toBe(true);
      expect(res2.statusCode).toBe('M_A3');

      // @ts-ignore
      const isJwt = validate.isJWT(res2.data.api_token);
      expect(isJwt).toBe(true);
      // @ts-ignore
      expect(res2.data.first_time).toBe(true);
    });
  });

  describe('staffLogin()', () => {
    it('should not verify the user', async () => {
      const res = await controller.staffLogin(344532, '+905532850053', 'hello');

      expect(res.status).toBe(false);
      expect(res.message).toBe('Invalid OTP');
    });

    it('correct opt but non admin user', async () => {
      let mobile = '+905532850053';
      const res = await controller.login(authUser, mobile);

      const res1 = await controller.staffLogin(
        res.data.otp,
        '+905532850053',
        'hello',
      );

      expect(res1.status).toBe(false);
      expect(res1.message).toBe('No user found');
    });

    it('correct login', async () => {
      const db = conn.collection('users');
      await db.insertOne({
        role: 'admin',
        status: 'active',
        fcm_token: '',
        password_set: true,
        userid: '6ac01bc3-66bb-47d9-8c1f-52327fc005af',
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
      let mobile = '+905532850053';
      const res = await controller.login(authUser, mobile);

      const res1 = await controller.staffLogin(res.data.otp, mobile, 'hello');

      // @ts-ignore
      const isJwt = validate.isJWT(res1.data.api_token);

      expect(res1.status).toBe(true);
      expect(isJwt).toBe(true);
    });
  });
});
