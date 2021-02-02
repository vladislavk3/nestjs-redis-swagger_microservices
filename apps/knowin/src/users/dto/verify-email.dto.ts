import { IsDefined, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyUserEmailDto {
  @ApiProperty()
  @IsDefined()
  @IsNumber()
  otp: number;
}
