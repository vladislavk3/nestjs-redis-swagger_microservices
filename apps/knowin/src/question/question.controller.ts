import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AddQuestionDto } from './dto/add-question.dto';
import { QuestionService } from './question.service';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { getCode } from 'knowin/status-codes';

@ApiTags('Question')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Controller('question')
export class QuestionController {
  constructor(readonly questionService: QuestionService) {}

  @Post('add')
  @Roles('admin', 'moderator')
  async addQuestion(@Body() addQuestionDto: AddQuestionDto) {
    try {
      const question = await this.questionService.addQuestion(addQuestionDto);
      return {
        status: true,
        statusCode: getCode('M_Q1'),
        data: question,
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

  @Post('add-bulk')
  @Roles('admin', 'moderator')
  async addQuestionBulk(@Body() addQuestionDto: AddQuestionDto[]) {
    try {
      const question = await this.questionService.addQuestionBulk(
        addQuestionDto,
      );
      return {
        status: true,
        statusCode: getCode('M_Q1'),
        data: question,
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

  @Put('update')
  @Roles('admin', 'moderator')
  async updateQuestion(
    @Body() addQuestionDto: AddQuestionDto,
    @Query('id') id: string,
  ) {
    try {
      const question = await this.questionService.updateQuestion(
        id,
        addQuestionDto,
      );
      return {
        status: true,
        statusCode: getCode('M_Q1'),
        data: question,
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

  @Get('/all')
  @Roles('admin', 'moderator')
  async getQuestion(
    @Query('page') page: number,
    @Query('count') count: number,
    @Query('search') search?: string,
    @Query('level') level?: any,
    @Query('tags') tags?: any,
    @Query('onlyNew') onlyNew?: any,
    @Query('rangeEnable') rangeEnable?: boolean,
    @Query('range') range?: number,
  ) {
    const result = await this.questionService.getAllQuestions(
      page,
      count,
      search,
      level,
      tags,
      onlyNew,
      rangeEnable,
      range,
    );
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: result,
    };
  }

  @Put('/reset')
  @Roles('admin', 'moderator')
  async resetQuestion(@Query('id') id: string) {
    await this.questionService.resetQuestion(id);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: {
        id,
      },
    };
  }

  @Delete('/delete')
  @Roles('admin', 'moderator')
  async deleteQuestion(@Query('id') id: string) {
    await this.questionService.deleteQuestion(id);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: {
        id,
      },
    };
  }
}
