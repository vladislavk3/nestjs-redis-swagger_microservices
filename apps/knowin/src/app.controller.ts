import { Controller, Get, UseGuards, Query, Post } from '@nestjs/common';
import { RoleGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { AppService } from './app.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@Controller()
@ApiTags('Settings')
@ApiBearerAuth()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/version')
  async getVersion() {
    try {
      return this.appService.getSettings();
    } catch (error) {
      return {
        message: 'Error Fetching version',
      };
    }
  }

  @UseGuards(RoleGuard)
  @Roles('admin')
  @Post('/version')
  async setVersion(
    @Query('isUnderMaintenance') isUnderMaintenance: boolean,
    @Query('version') version: string,
  ) {
    try {
      await this.appService.setSettings(isUnderMaintenance, version);
      return {
        done: true,
      };
    } catch (error) {
      return {
        message: 'Error setting version',
      };
    }
  }
}
