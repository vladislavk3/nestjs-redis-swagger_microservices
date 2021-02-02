import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { QuestionModule } from '../question/question.module';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsSchema } from 'knowin/common';
import { AccountSchema } from 'knowin/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Analytics',
        schema: AnalyticsSchema,
      },
      {
        name: 'Account',
        schema: AccountSchema,
      },
    ]),
    QuestionModule,
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
