import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { JwtMiddleware } from './jwt.middleware';
import { UsersController } from './users/users.controller';
import { ProductsModule } from './products/products.module';
import { ProductsController } from './products/products.controller';
import { QuestionModule } from './question/question.module';
import { QuizModule } from './quiz/quiz.module';
import { QuizController } from './quiz/quiz.controller';
import { QuestionController } from './question/question.controller';
import { UiController } from './ui/ui.controller';
import { UiService } from './ui/ui.service';
import { UiScheme } from './ui/ui.schema';
import { AccountModule } from './account/account.module';
import { AccountController } from './account/account.controller';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { LeaderboardController } from './leaderboard/leaderboard.controller';
import { NotificationModule } from './notification/notifications.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TransactionModule } from './transaction/transaction.module';
import { TransactionController } from './transaction/transaction.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { PublicModule } from './public/public.module';
import { SettingsSchema } from './settings/settings.schema';
import { AppService } from './app.service';
import { PromotionsModule } from './promotions/promotions.module';
import { PromotionsController } from './promotions/promotions.controller';

@Module({
  imports: [
    RavenModule,
    JwtModule.register({
      secret: process.env.TOKEN_JWT_OTP,
      signOptions: {
        expiresIn: '1y',
      },
    }),
    MongooseModule.forRoot(process.env.MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }),
    MongooseModule.forFeature([
      {
        name: 'UI',
        schema: UiScheme,
      },
      {
        name: 'Settings',
        schema: SettingsSchema,
      },
    ]),
    UsersModule,
    AuthModule,
    ProductsModule,
    QuestionModule,
    QuizModule,
    AccountModule,
    LeaderboardModule,
    NotificationModule,
    AnalyticsModule,
    TransactionModule,
    PublicModule,
    PromotionsModule,
  ],
  controllers: [AppController, UiController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor(),
    },
    UiService,
    AppService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(JwtMiddleware)
      .forRoutes(
        UsersController,
        ProductsController,
        QuizController,
        QuestionController,
        UiController,
        AccountController,
        LeaderboardController,
        TransactionController,
        AnalyticsController,
        AppController,
        PromotionsController,
      );
  }
}
