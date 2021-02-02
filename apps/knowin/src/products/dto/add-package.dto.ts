import {
  IsDefined,
  IsString,
  IsIn,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { PurchaseMode, PackageType } from 'knowin/common';

export class AddPakckageDto {
  @ApiProperty()
  @IsDefined()
  readonly packageId: string;

  @ApiProperty()
  @IsDefined()
  readonly title: string;

  @ApiProperty()
  @IsDefined()
  @Min(0)
  @IsNumber()
  readonly heartCount?: number;

  @ApiProperty()
  @IsDefined()
  @Min(0)
  @IsNumber()
  readonly passCount?: number;

  @ApiProperty()
  @IsDefined()
  @Min(0)
  @IsNumber()
  readonly fiftyFiftyCount?: number;

  @ApiProperty()
  @IsDefined()
  @Min(0)
  @IsNumber()
  readonly twoAnswerCount?: number;

  @ApiProperty()
  @IsDefined()
  @Min(0)
  @IsNumber()
  readonly keyCount?: number;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsIn(['coin', 'money'])
  readonly purchaseMode?: PurchaseMode;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  @Min(0)
  readonly price?: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  @Min(0)
  readonly priceSold?: number;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsIn(['key', 'package', 'heart', 'pass', 'two_answer', 'fifty_fifty'])
  readonly type: PackageType;

  @ApiProperty()
  @IsDefined()
  readonly isOffer: boolean;

  @ApiProperty()
  @IsDefined()
  readonly discountPercent: number;

  @ApiProperty()
  @IsDefined()
  @IsOptional()
  readonly validTill: any;

  @ApiProperty()
  @IsDefined()
  @IsOptional()
  readonly _id?: string;
}
