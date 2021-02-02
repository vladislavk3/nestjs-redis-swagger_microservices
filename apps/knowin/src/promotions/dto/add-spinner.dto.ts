import {
  IsDefined,
  IsBoolean,
  IsIn,
  IsNumber,
  ValidateNested,
  IsInstance,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SpinWinType } from 'knowin/common';
import { Type } from 'class-transformer';

class Prize {
  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly key: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly extra_life_joker: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly two_answer: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly pass_question: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly fifty_fifty: number;
}

class SpinnerOptions {
  @ApiProperty()
  @IsDefined()
  readonly id: string;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly index: number;

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly weightage: number;

  @ApiProperty()
  @IsDefined()
  @Type(() => Prize)
  @ValidateNested()
  @IsInstance(Prize)
  readonly prize: Prize;
}

export class AddSpinner {
  @ApiProperty()
  @IsDefined()
  readonly spinnerId: string;

  @ApiProperty()
  @IsDefined()
  @IsBoolean()
  readonly active: boolean;

  @ApiProperty()
  @IsDefined()
  @IsIn([SpinWinType.vip, SpinWinType.regular])
  readonly type: string;

  @ApiProperty()
  @IsDefined()
  @Type(() => SpinnerOptions)
  @ValidateNested({
    each: true,
  })
  @IsInstance(SpinnerOptions, {
    each: true,
  })
  readonly options: SpinnerOptions[];
}
