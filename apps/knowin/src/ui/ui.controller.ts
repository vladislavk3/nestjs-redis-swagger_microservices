import {
  Controller,
  Get,
  Post,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { UiService } from '../ui/ui.service';
import { getCode } from 'knowin/status-codes';

@ApiTags('UI')
@ApiBearerAuth()
@UseGuards(RoleGuard)
@Controller('ui')
export class UiController {
  constructor(private uiService: UiService) {}

  @Roles('admin', 'moderator')
  @Get('tags')
  async getTags() {
    const tags = await this.uiService.getAll('tag');
    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {
        tags,
      },
    };
  }

  @Roles('admin', 'moderator')
  @Get('category')
  async getCategory() {
    const categorys = await this.uiService.getAll('category');
    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {
        categorys,
      },
    };
  }

  @Roles('admin', 'moderator')
  @Post('all')
  async update(
    @Query('name') name: string,
    @Query('old') old: string,
    @Query('type') type: string,
  ) {
    try {
      await this.uiService.update(old, name, type);
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data: {
          old,
          name,
          type,
        },
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_U1'),
        data: {},
      };
    }
  }

  @Roles('admin', 'moderator')
  @Delete('')
  async delete(@Query('name') name: string, @Query('type') type: string) {
    await this.uiService.delete(name, type);
    return {
      status: true,
      statusCode: getCode('M_DONE'),
      data: {
        name,
        type,
      },
    };
  }

  @Roles('admin', 'moderator')
  @Post('tags')
  async addTags(@Query('tag') tag: string) {
    try {
      await this.uiService.newTag(tag);
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data: {},
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_U1'),
        data: {},
      };
    }
  }

  @Roles('admin', 'moderator')
  @Post('category')
  async addCategory(@Query('category') category: string) {
    try {
      await this.uiService.newCategory(category);
      return {
        status: true,
        statusCode: getCode('M_DONE'),
        data: {},
      };
    } catch (error) {
      return {
        status: false,
        statusCode: getCode('M_U1'),
        data: {},
      };
    }
  }
}
