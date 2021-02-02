import { Controller, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ApiTags, ApiQuery } from '@nestjs/swagger';
import { getCode } from 'knowin/status-codes';
import isMobilePhone from 'validator/lib/isMobilePhone';
import { AuthLimiter } from './auth.limiter';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private authLimiter: AuthLimiter,
  ) {}

  @Post('/login')
  async login(@Req() req: Request, @Query('mobile') mobile: string) {
    mobile = mobile.replace(/ /g, '');
    if (!this.isMobileNo(mobile)) {
      return {
        status: false,
        statusCode: getCode('M_A2'),
        data: {
          mobile,
        },
      };
    }

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (Array.isArray(ip)) {
      ip = ip[0];
    }

    //IF in Dev
    if (process.env.KNOWIN_ENV === 'production') {
      //Rate limiting
      //First check how many times this ip requested for a OTP; and if this ip is blocked or not
      //IF passed then
      const { allowed, ...rest } = await this.authLimiter.check(ip);

      //Not ok
      if (!allowed) {
        return {
          status: false,
          statusCode: getCode('M_LIMIT_EXCEEDED'),
          data: {
            ...rest,
          },
        };
      }

      // ok send otp
      await this.authService.otpSeq(mobile, req.query.lang || 'en');
      return {
        status: true,
        statusCode: getCode('M_A1'),
        data: {
          mobile,
        },
      };
    } else {
      const otp = await this.authService.otpSeq(mobile, req.query.lang || 'en');
      return {
        status: true,
        statusCode: getCode('M_A1'),
        data: {
          mobile,
          otp,
        },
      };
    }
  }

  @ApiQuery({ name: 'fcm_token', required: false })
  @Post('/verify')
  async verify(
    @Query('otp') otp: number,
    @Query('mobile') mobile: string,
    @Query('fcm_token') fcm_token?: string,
  ) {
    // sanatizy mobile
    mobile = mobile.replace(/ /g, '');
    if (!this.isMobileNo(mobile)) {
      return {
        status: false,
        statusCode: getCode('M_A2'),
        data: {
          mobile,
        },
      };
    }

    const result = await this.authService.verifyOtpAndGenToken(
      otp,
      mobile,
      fcm_token,
    );

    if (result.verify) {
      return {
        status: true,
        statusCode: getCode('M_A3'),
        data: result.data,
      };
    } else {
      return {
        status: false,
        statusCode: getCode('M_A4'),
        data: {},
      };
    }
  }

  isMobileNo(mobile: string): boolean {
    // @ts-ignore
    return isMobilePhone(mobile, false, {
      strictMode: true,
    });
  }

  // admin
  @Post('/staff/verify')
  async staffLogin(
    @Query('otp') otp: number,
    @Query('mobile') mobile: string,
    @Query('password') password: string,
  ) {
    mobile = mobile.replace(/ /g, '');
    if (!this.isMobileNo(mobile)) {
      return {
        status: false,
        statusCode: getCode('M_A2'),
        data: {
          mobile,
        },
      };
    }

    // start the seq
    const data = await this.authService.verifyOtpAndGenTokenDash(
      otp,
      password,
      mobile,
    );

    return {
      status: data.verify,
      message: data.message,
      data: data.data,
    };
  }
}
