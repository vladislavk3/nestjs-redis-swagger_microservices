import { Module } from '@nestjs/common';
import { LeaderboardController } from '../leaderboard/leaderboard.controller';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { MongooseModule } from '@nestjs/mongoose';
import { LeaderBoardWeeklySchema } from './schemas/leaderboard-weekly.schema';
import { UserSchema } from 'knowin/common';
import { QuizSchema } from 'knowin/common';
import { LeaderBoardSeasonSchema } from '../leaderboard/schemas/leaderboard-season.schema';
import { AnalyticsModule } from '../analytics/analytics.module';
import { AccountModule } from '../account/account.module';
import { AccountService } from '../account/account.service';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { NotificationModule } from '../notification/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'LeaderBoardWeekly',
        schema: LeaderBoardWeeklySchema,
      },
      {
        name: 'LeaderBoardSeason',
        schema: LeaderBoardSeasonSchema,
      },
      {
        name: 'Quiz',
        schema: QuizSchema,
      },
      {
        name: 'Users',
        schema: UserSchema,
      },
    ]),
    AnalyticsModule,
    AccountModule,
    UsersModule,
    NotificationModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
