import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Query,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { UpdateLeaderBoard } from '../leaderboard/dto/update-leaderboard.dto';
import { AuthRequest } from '../jwt.middleware';
import { getCode } from 'knowin/status-codes';

@ApiTags('Leaderboard')
@ApiBearerAuth()
@Controller('leaderboard')
export class LeaderboardController {
  private readonly logger = new Logger('Leaderboard Controller');
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get('/')
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  async getLeaderBoard(
    @Req() req: AuthRequest,
    @Query('limit') limit = 10,
    @Query('page') page = 0,
  ) {
    try {
      const data = await this.leaderboardService.getCurrentLeaderBoard(
        req.user.userid,
        +limit,
        +page,
      );

      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: data,
      };
    } catch (error) {
      this.logger.error(error.toString());
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  @Get('/season')
  @ApiQuery({
    name: 'limit',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    required: false,
  })
  async getLeaderBoardSeason(
    @Req() req: AuthRequest,
    @Query('limit') limit = 10,
    @Query('page') page = 0,
  ) {
    try {
      const data = await this.leaderboardService.getSeasonLeaderBoard(
        req.user.userid,
        +limit,
        +page,
      );
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: data,
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  @Get('/rank')
  async getRank(@Req() req: AuthRequest) {
    try {
      const res = await this.leaderboardService.getRanks(req.user.userid);
      return {
        status: true,
        statusCode: getCode('M_OK'),
        data: res,
      };
    } catch (error) {
      this.logger.log(error.toString());
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {},
      };
    }
  }

  @Post('/')
  setLeaderBoard(
    @Req() req: Request,
    @Body() updateLeaderBoard: UpdateLeaderBoard,
  ) {
    if (this.validate(req)) {
      return this.leaderboardService.saveLeaderBoardFromGame(updateLeaderBoard);
    } else {
      this.logger.log(`Updating Leaderboard validation failed...`);
      return {
        msg: 'not allowed',
      };
    }
  }

  //@Get('/global')
  //getGlobalLeaderBoard() {
  //return this.leaderboardService.getGlobalLeaderBoard();
  //}

  validate(req: Request) {
    const token = process.env.API_ACCESS_TOKEN_MAIN;
    const { authorization } = req.headers;
    if (authorization === token) {
      return true;
    } else {
      return false;
    }
  }
}
