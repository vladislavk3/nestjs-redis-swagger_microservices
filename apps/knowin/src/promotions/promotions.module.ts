import { Module } from '@nestjs/common';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';
import { MongooseModule } from '@nestjs/mongoose';
import { SpinWinSchema, ProductsSchema, AccountSchema } from 'knowin/common';
import { SpinnerSchema } from 'knowin/common/schemas/spinner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: 'Spinwin',
        schema: SpinWinSchema,
      },
      {
        name: 'Spinner',
        schema: SpinnerSchema,
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
  controllers: [PromotionsController],
  providers: [PromotionsService],
})
export class PromotionsModule {}
