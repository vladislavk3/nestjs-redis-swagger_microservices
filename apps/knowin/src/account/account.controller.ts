import { Controller, Get, Req, Post, Logger, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthRequest } from '../jwt.middleware';
import { AccountService } from './account.service';
import { getCode } from 'knowin/status-codes/code.map';

@ApiTags('Account')
@ApiBearerAuth()
@Controller('account')
export class AccountController {
  constructor(readonly accountService: AccountService) {}

  @Get('/')
  async getAccount(@Req() req: AuthRequest) {
    const account = await this.accountService.getAccountInfo(req.user.userid);
    if (account) {
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: account.toJSON(),
      };
    } else {
      return {
        status: false,
        statusCode: getCode('M_NOT_FOUND'),
        data: null,
      };
    }
  }

  @Get('/points')
  async getPoints(@Req() req: AuthRequest) {
    const points = await this.accountService.getAccountPoints(req.user.userid);
    if (points) {
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: points.toJSON(),
      };
    } else {
      return {
        status: false,
        statusCode: getCode('M_NOT_FOUND'),
        data: null,
      };
    }
  }

  @Get('/info')
  async getInfo(@Req() req: AuthRequest, @Query('fields') fields: string) {
    const allowed = new Set([
      'points',
      'iban_no',
      'joinedgames',
      'wongames',
      'playedgames',
      'userid',
    ]);
    if (this.validateQuery(fields, allowed)) {
      const data = await this.accountService.getAccountInfoV2(
        req.user.userid,
        fields.split(',').join(' '),
      );
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data: data.toJSON(),
      };
    } else {
      return {
        status: true,
        statusCode: getCode('M_Q_NA'),
        data: {},
      };
    }
  }

  validateQuery(query: string, allowed: Set<string>): boolean {
    if (typeof query !== 'string') return false;
    const fields = query.split(',');
    return fields.every(item => allowed.has(item));
  }

  @Post('/info')
  async addInfo(@Req() req: AuthRequest, @Query('iban_no') iban_no: string) {
    try {
      await this.accountService.addInfo({
        iban_no,
        userid: req.user.userid,
      });
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data: {},
      };
    } catch (e) {
      Logger.error(e.toString());
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {},
      };
    }
  }
}
