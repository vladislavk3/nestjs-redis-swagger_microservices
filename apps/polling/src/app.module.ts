import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { RavenModule, RavenInterceptor } from 'nest-raven';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { NotificationService } from './notification/notification.service';
import {
  QuizSchema,
  PurchaseSchema,
  UserSchema,
  ProductsSchema,
  PackagesSchema,
  AnalyticsSchema,
} from 'knowin/common';
import { AccountSchema } from 'knowin/common/schemas/account.schema';

@Module({
  imports: [
    RavenModule,
    MongooseModule.forRoot(configuration.database.monogo, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forFeature([
      {
        name: 'Quiz',
        schema: QuizSchema,
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
    ]),
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useValue: new RavenInterceptor(),
    },
    AppService,
    NotificationService,
  ],
})
export class AppModule {}
