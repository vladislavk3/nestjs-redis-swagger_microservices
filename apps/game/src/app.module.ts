import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppGateway } from './app.gateway';
import { NotificationService } from './notification/notification.service';
import configuration from './config/configuration';
import {
  QuizSchema,
  UserSchema,
  PurchaseSchema,
  ProductsSchema,
  PackagesSchema,
  AnalyticsSchema,
  AccountSchema,
  QuestionSchema,
  SpinWinSchema,
} from 'knowin/common';

@Module({
  imports: [
    RavenModule,
    MongooseModule.forRoot(configuration.database.monogo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }),
    MongooseModule.forFeature([
      {
        name: 'Quiz',
        schema: QuizSchema,
      },
      {
        name: 'Question',
        schema: QuestionSchema,
      },
      {
        name: 'Users',
        schema: UserSchema,
      },
      {
        name: 'Purchase',
        schema: PurchaseSchema,
      },
      {
        name: 'Products',
        schema: ProductsSchema,
      },
      {
        name: 'Packages',
        schema: PackagesSchema,
      },
      {
        name: 'Analytics',
        schema: AnalyticsSchema,
      },
      {
        name: 'Account',
        schema: AccountSchema,
      },
      {
        name: 'Spinwin',
        schema: SpinWinSchema,
      },
    ]),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor(),
    },
    AppService,
    AppGateway,
    NotificationService,
  ],
})
export class AppModule {}
