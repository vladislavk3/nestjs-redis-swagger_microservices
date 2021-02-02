import { Module, forwardRef } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  UserSchema,
  ProductsSchema,
  AccountSchema,
  AnalyticsSchema,
} from 'knowin/common';
import { EmailVerifySchema } from './schemas/email-verify.schema';
import { AuthModule } from '../auth/auth.module';
import { PasswordUtil } from '../auth/auth.utils';
import { AnalyticsModule } from '../analytics/analytics.module';
import { NotificationModule } from '../notification/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Users',
        schema: UserSchema,
      },
      {
        name: 'EmailVerify',
        schema: EmailVerifySchema,
      },
      {
        name: 'Products',
        schema: ProductsSchema,
      },
      {
        name: 'Account',
        schema: AccountSchema,
      },
      {
        name: 'Analytics',
        schema: AnalyticsSchema,
      },
    ]),
    AuthModule,
    AnalyticsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService, PasswordUtil],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
