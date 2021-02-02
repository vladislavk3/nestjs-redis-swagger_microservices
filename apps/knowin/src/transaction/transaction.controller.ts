import {
  Controller,
  Post,
  Body,
  Req,
  Logger,
  Get,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { AddTransactionDto } from './dto/add-transactions.dto';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthRequest } from '../jwt.middleware';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { ITransactionStatus } from './interfaces/transaction.interface';
import { getCode } from 'knowin/status-codes';

@UseGuards(RoleGuard)
@ApiTags('transaction')
@ApiBearerAuth()
@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Roles('admin', 'moderator', 'user')
  @Get('/')
  async listAll(
    @Req() req: AuthRequest,
    @Query('limit') limit: number,
    @Query('page') page: number,
  ) {
    try {
      const list = await this.transactionService.listAllTransactions(
        req.user.userid,
        limit,
        page,
      );

      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: list,
      };
    } catch (error) {
      Logger.log(error.toString());
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  //@Roles('admin', 'moderator', 'user')
  //@Get('/stats')
  //async getStats(@Req() req: AuthRequest) {
  //const { userid } = req.user;
  //const data = await this.transactionService.getStats(userid);

  //return {
  //status: true,
  //message: 'Done',
  //data,
  //};
  //}

  @Roles('admin', 'moderator', 'user')
  @Post('/redeem')
  async redeemPoints(
    @Req() req: AuthRequest,
    @Body() transaction: AddTransactionDto,
  ) {
    try {
      const res = await this.transactionService.addNewTransaction(
        transaction,
        req.user.userid,
      );
      return {
        status: true,
        statusCode: getCode('M_T1'),
        data: res,
      };
    } catch (error) {
      Logger.error(error.toString());
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  // ADMIN
  // filters => paid, pending,
  @Roles('admin')
  @Get('/list_all')
  async _getAll(@Req() req: AuthRequest) {
    try {
      // @ts-ignore
      const res = await this.transactionService._listAllTransactions(req.query);
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: res,
      };
    } catch (error) {
      Logger.error(error.toString());
      return {
        status: false,
        message: error.toString(),
        data: {},
      };
    }
  }

  @Roles('admin')
  @Post('/mark')
  async _mark(
    @Query('transactionId') transactionId: string,
    @Query('status') status: ITransactionStatus,
    @Query('message') message: string,
  ) {
    try {
      const {
        statusCode,
        done,
      } = await this.transactionService._markTransactions(
        transactionId,
        status,
        message,
      );

      return {
        status: done,
        statusCode,
        data: {},
      };
    } catch (error) {
      Logger.error(error.toString());
      return {
        status: false,
        message: error.toString(),
        data: {},
      };
    }
  }
}
