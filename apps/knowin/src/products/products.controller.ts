import {
  Controller,
  Get,
  Req,
  Logger,
  Post,
  Body,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { getCode } from 'knowin/status-codes';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuthRequest } from '../jwt.middleware';
import { ProductsService } from './products.service';
import { RoleGuard } from '../roles.guard';
import { Roles } from '../roles.decorator';
import { AddPakckageDto } from './dto/add-package.dto';

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
@UseGuards(RoleGuard)
export class ProductsController {
  // Config Object For In App Purchase
  constructor(readonly productService: ProductsService) {}
  /*
      Body : {
        packageName: String,
        productId: String,
        purchaseToken: String,
        subscription: Boolean
      }
  */
  @Roles('user', 'admin', 'moderator')
  @Get('/')
  async getProductsList(@Req() req: AuthRequest) {
    const products = await this.productService.getProductsInfo(req.user.userid);
    return {
      status: true,
      statusCode: getCode('M_OK'),
      data: products,
    };
  }

  @Roles('user', 'admin', 'moderator')
  @Post('/verify')
  async verifyPurchase(@Req() req: AuthRequest, @Body() receipt: any) {
    try {
      const {
        status,
        statusCode,
      } = await this.productService.verifyAndAddPackage(
        req.user.userid,
        receipt,
      );

      return {
        status,
        statusCode,
      };
    } catch (err) {
      Logger.error(err.toString());
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {},
      };
    }
  }

  @Roles('user', 'admin', 'moderator')
  @Post('/verify-coin')
  async buyPackageUsingCoins(@Req() req: AuthRequest, @Query('id') id: string) {
    try {
      const {
        status,
        statusCode,
      } = await this.productService.buyPackageUsingCoins(req.user.userid, id);

      return {
        status,
        statusCode,
      };
    } catch (err) {
      Logger.error(err.toString());
      return {
        status: false,
        statusCode: getCode('M_TRY_AGAIN'),
        data: {},
      };
    }
  }

  // Marketplace apis for admin
  @Roles('admin')
  @Post('/add-package')
  async addItem(@Body() newPackage: AddPakckageDto) {
    return this.productService.addNewPackage(newPackage);
  }

  @Roles('user', 'admin', 'moderator')
  @Get('/get-package')
  async getpPackages(
    @Query('page') page: number,
    @Query('limit') limit: number,
  ) {
    return this.productService.getPackages(page, limit);
  }

  @Roles('admin')
  @Delete('/delete-package')
  async deletePackages(@Query('id') id: string) {
    return this.productService.deletePackage(id);
  }

  // get
  @Roles('admin')
  @Get('/purchase-history')
  async getPurchaseHistory(
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('types') types: string[],
    @Query('onlyRefund') onlyRefund: boolean,
    @Query('search') search: string,
  ) {
    return this.productService.getPurchaseHistory(
      page,
      limit,
      types,
      onlyRefund,
      search,
    );
  }

  // Apple needs a refund api which
  // it will hit when a refund is made
  @Post('apple-refund')
  appleRefund(@Body() receipt: any) {
    return this.productService.appleRefund(receipt);
  }
}
