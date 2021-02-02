import {
  Controller,
  Get,
  UseGuards,
  Query,
  Post,
  Body,
  Delete,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { RoleGuard } from '../roles.guard';
import { QuizService } from './quiz.service';
import { Roles } from '../roles.decorator';
import { AddQuizDto } from './dto/add-quiz.dto';
import { AuthRequest } from '../jwt.middleware';
import { NotificationService } from '../notification/notification.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { getCode } from 'knowin/status-codes';
import { AnalyticsService } from '../analytics/analytics.service';

@ApiTags('Quiz')
@ApiBearerAuth()
@Controller('quiz')
@UseGuards(RoleGuard)
export class QuizController {
  constructor(
    readonly quizService: QuizService,
    private readonly analyticsService: AnalyticsService,
    private readonly notificationService: NotificationService,
  ) {}

  @Roles('admin', 'moderator', 'user')
  @Get('/')
  async getQuiz(@Query('id') id: string) {
    const result = await this.quizService.getQuiz(id);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (_, file, callback) => {
        const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
        if (ALLOWED_FILE_TYPES.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Quiz fields',
    type: AddQuizDto,
  })
  @Roles('admin', 'moderator')
  @Post('add')
  async addQuiz(@Body() addQuizDto: AddQuizDto, @UploadedFile() file: any) {
    const fileType = addQuizDto.file_url === '' ? 'new' : 'old';

    if (fileType === 'new' && !file) {
      return {
        status: false,
        message: 'Image not found',
        statusCode: getCode('M_QQ1'),
        data: {},
      };
    }

    try {
      const quiz = await this.quizService.addQuiz(addQuizDto, file, fileType);

      // Update the played
      await this.analyticsService.updateQuestionStatsByOne(
        addQuizDto.questionlist,
      );

      await this.notificationService.sendToAll({
        data: {
          type: 'NEW_QUIZ',
          quizid: quiz.quizid,
        },
        topic: 'all',
      });

      return {
        status: true,
        statusCode: getCode('M_QQ2'),
        data: quiz,
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_IE'),
        data: {
          error,
        },
      };
    }
  }

  @Roles('admin', 'moderatro')
  @Post('/cancel')
  async cancelQuiz(@Query('quizId') quizId: string) {
    const { statusCode, done } = await this.quizService.cancelQuiz(quizId);
    return {
      status: done,
      statusCode,
    };
  }

  @Roles('admin', 'user', 'moderatro')
  @Post('/join')
  async joinQuiz(@Req() req: AuthRequest, @Query('quizId') quizId: string) {
    const { statusCode, joined } = await this.quizService.joinUserQuiz(
      req.user.userid,
      quizId,
    );
    return {
      status: joined,
      statusCode,
      data: {},
    };
  }

  @Roles('admin', 'user', 'moderatro')
  @Post('/leave')
  async leaveQuiz(@Req() req: AuthRequest, @Query('quizId') quizId: string) {
    const { statusCode, done } = await this.quizService.leaveQuiz(
      req.user.userid,
      quizId,
    );
    return {
      status: done,
      statusCode,
    };
  }

  @Roles('admin', 'user', 'moderatro')
  @Get('/join')
  async getJoinQuiz(@Req() req: AuthRequest) {
    const result = await this.quizService.getUserJoinedQuiz(req.user.userid);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  // here
  @Roles('admin', 'moderator')
  @Get('/all')
  async getActiveQuiz(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('onlyNew') onlyNew: boolean,
  ) {
    const result = await this.quizService.getAllActiveQuiz(
      page,
      limit,
      onlyNew,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  @Roles('admin', 'user', 'moderator')
  @Get('/list')
  async getQuizAll(
    @Req() req: AuthRequest,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('game_type') game_type: string,
  ) {
    const result = await this.quizService.getAllPublicActiveQuiz(
      req.user.userid,
      page,
      limit,
      game_type,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  // here
  @Roles('admin', 'user')
  @Get('/vip')
  async getVipQuiz(
    @Req() req: AuthRequest,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    if (!limit) {
      limit = 10;
    }
    const result = await this.quizService.getVipQuiz(
      req.user.userid,
      page,
      limit,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  @Roles('admin', 'user')
  @Get('/popular')
  async getPopularQuiz(@Query('limit') limit: number) {
    if (!limit) {
      limit = 10;
    }
    const result = await this.quizService.getPopularQuiz(limit);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  // here
  @Roles('admin', 'user')
  @Get('/upcoming')
  async getUpcomingQuiz(
    @Req() req: AuthRequest,
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    if (!limit) {
      limit = 10;
    }
    const result = await this.quizService.getUpcomingQuiz(
      req.user.userid,
      page,
      limit,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  @Roles('admin', 'moderator')
  @Delete('/delete')
  async deleteQuiz(@Query('id') id: string) {
    await this.quizService.deleteQuiz(id);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: {},
    };
  }

  @Roles('admin', 'moderator')
  @Get('/banners')
  async getQuizBanner() {
    const imageList = await this.quizService.getQuizBanner();
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: imageList,
    };
  }

  @Roles('admin', 'moderator')
  @Get('/game-history')
  async getPlayedGames(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    const gameList = await this.quizService.getPlayedGames(page, limit);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: gameList,
    };
  }

  @Roles('admin', 'moderator')
  @Get('/single-game-history')
  async getSinglePlayedGames(@Query('quizid') quizid: string) {
    const quizData = await this.quizService.getSinglePlayedGames(quizid);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: quizData,
    };
  }

  @Roles('admin', 'moderator')
  @Get('/player-history')
  async getPlayerHistory(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('userid') userid: string,
  ) {
    const quizList = await this.quizService.getPlayerHistory(
      userid,
      page,
      limit,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: quizList,
    };
  }

  @Roles('admin', 'moderator')
  @Post('/remove-banner')
  async removeBanner(@Query('bannerid') bannerid: string) {
    await this.quizService.removeBanner(bannerid);
    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {},
    };
  }
}
