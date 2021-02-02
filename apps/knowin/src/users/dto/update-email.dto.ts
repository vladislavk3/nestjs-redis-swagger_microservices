import { IsDefined, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserEmailDto {
  @ApiProperty()
  @IsDefined()
  @IsEmail()
  email: string;
}
