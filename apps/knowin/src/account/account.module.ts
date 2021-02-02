import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountSchema } from 'knowin/common';
import { UsersModule } from '../users/users.module';
import { QuestionModule } from '../question/question.module';
import { NotificationModule } from '../notification/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Account',
        schema: AccountSchema,
      },
    ]),
    UsersModule,
    QuestionModule,
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [MongooseModule, AccountService],
})
export class AccountModule {}
