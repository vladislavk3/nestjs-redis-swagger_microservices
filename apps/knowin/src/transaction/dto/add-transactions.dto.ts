import { IsDefined, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddTransactionDto {
  @ApiProperty()
  @IsDefined()
  @IsNumber()
  readonly points: number;
}
