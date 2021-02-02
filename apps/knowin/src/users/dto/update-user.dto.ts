import { IsString, Length, IsIn, IsOptional, IsLocale } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from 'knowin/common';

export class UpdateUserDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(2, 100)
  readonly name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  @Length(3, 30)
  readonly username?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  readonly dob?: string;

  @IsOptional()
  @ApiProperty()
  @IsIn(['male', 'female', 'others'])
  gender?: Gender;

  @IsOptional()
  @ApiProperty()
  fcm_token?: string;

  @IsOptional()
  @IsLocale()
  @ApiProperty()
  locale?: string;
}
