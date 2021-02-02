import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductsSchema,
  UserSchema,
  PurchaseSchema,
  PackagesSchema,
} from 'knowin/common';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Products',
        schema: ProductsSchema,
      },
      {
        name: 'Purchase',
        schema: PurchaseSchema,
      },
      {
        name: 'Users',
        schema: UserSchema,
      },
      {
        name: 'Packages',
        schema: PackagesSchema,
      },
    ]),
    AccountModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
