import { Module } from '@nestjs/common';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';
import { MongooseModule } from '@nestjs/mongoose';
import { QuizSchema, PlayedGameSchema } from 'knowin/common';
import { UserSchema, AccountSchema, ProductsSchema } from 'knowin/common';
import { NotificationModule } from '../notification/notifications.module';
import { AnalyticsModule } from '../analytics/analytics.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Quiz',
        schema: QuizSchema,
      },
      {
        name: 'Account',
        schema: AccountSchema,
      },
      {
        name: 'Products',
        schema: ProductsSchema,
      },
      {
        name: 'Users',
        schema: UserSchema,
      },
      {
        name: 'PlayedGame',
        schema: PlayedGameSchema,
      },
    ]),
    NotificationModule,
    AnalyticsModule,
  ],
  controllers: [QuizController],
  providers: [QuizService],
})
export class QuizModule {}
