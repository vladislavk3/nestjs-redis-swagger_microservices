import { Controller, Logger, Req, Get } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { getCode } from 'knowin/status-codes';
import { AnalyticsService } from '../analytics/analytics.service';
import { AuthRequest } from '../jwt.middleware';

@Controller('analytics')
@ApiTags('analytics')
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('/graph')
  async getGraph(@Req() req: AuthRequest) {
    try {
      const res = await this.analyticsService.getGraph(req.user.userid);
      return {
        status: true,
        statusCode: getCode('M_OK'),
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

  @Get('/points')
  async getPointsStats(@Req() req: AuthRequest) {
    const data = await this.analyticsService.getPointsStats(req.user.userid);

    return {
      status: true,
      statusCode: getCode('M_OK'),
      data,
    };
  }
}
