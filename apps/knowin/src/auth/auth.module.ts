import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { OtpSchema } from '../auth/schemas/otp.schema';
import { UserSchema, ProductsSchema, AccountSchema } from 'knowin/common';
import { PasswordUtil } from './auth.utils';
import { AuthLimiter } from './auth.limiter';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.TOKEN_JWT_OTP,
      signOptions: {
        expiresIn: '60 days',
      },
    }),
    MongooseModule.forFeature([
      {
        name: 'Users',
        schema: UserSchema,
      },
      {
        name: 'Otp',
        schema: OtpSchema,
      },
      {
        name: 'Products',
        schema: ProductsSchema,
      },
      {
        name: 'Account',
        schema: AccountSchema,
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordUtil, AuthLimiter],
  exports: [AuthService],
})
export class AuthModule {}
