import { Module } from '@nestjs/common';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { TransactionSchema } from '../transaction/schemas/transaction.schema';
import { UsersModule } from '../users/users.module';
import { AccountModule } from '../account/account.module';
import { NotificationModule } from '../notification/notifications.module';
import { UserSchema } from 'knowin/common';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Transactions',
        schema: TransactionSchema,
      },
      {
        name: 'Users',
        schema: UserSchema,
      },
    ]),
    UsersModule,
    AccountModule,
    NotificationModule,
  ],
  controllers: [TransactionController],
  providers: [TransactionService],
})
export class TransactionModule {}
