import {
  Controller,
  Get,
  Req,
  UseGuards,
  Param,
  Post,
  Logger,
  Body,
  Query,
} from '@nestjs/common';
import { AuthRequest } from '../jwt.middleware';
import { ApiTags, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { PromotionsService } from './promotions.service';
import { getCode } from 'knowin/status-codes';
import { SpinWinType } from 'knowin/common';
import { AddSpinner } from './dto/add-spinner.dto';

@ApiTags('Promotions')
@ApiBearerAuth()
@Controller('promotions')
@UseGuards(RoleGuard)
export class PromotionsController {
  constructor(private readonly promoitionsService: PromotionsService) {}

  // Spin and win
  @ApiParam({
    enum: SpinWinType,
    name: 'id',
  })
  @Roles('user', 'admin', 'moderator')
  @Get('spin/:id')
  async getResult(@Req() req: AuthRequest, @Param('id') id: SpinWinType) {
    try {
      const data = await this.promoitionsService.after10GameSpinResults(
        req.user.userid,
        id,
      );
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data,
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {},
      };
    }
  }

  @ApiParam({
    enum: SpinWinType,
    name: 'id',
  })
  @Roles('user', 'admin', 'moderator')
  @Get('check/:id')
  async checkEligibility(
    @Req() req: AuthRequest,
    @Param('id') id: SpinWinType,
  ) {
    try {
      const data = await this.promoitionsService.checkEligibility(
        req.user.userid,
        id,
      );
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data,
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {},
      };
    }
  }

  @Roles('admin', 'moderator')
  @Get('get-spinner')
  async getSpinner() {
    try {
      const data = await this.promoitionsService.getSpinner();
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data,
      };
    } catch (err) {
      console.log(err.toString());
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {
          error: err.toString(),
        },
      };
    }
  }
  // Spinner
  @Roles('admin', 'moderator')
  @Post('update-spinner')
  async addSpinner() {
    try {
      Logger.log('Hello');
    } catch (err) {
      console.log(err.toString());
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {
          error: err.toString(),
        },
      };
    }
  }
}
