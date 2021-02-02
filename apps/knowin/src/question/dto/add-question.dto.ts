import {
  IsString,
  IsIn,
  IsNumber,
  IsArray,
  IsDefined,
  MinLength,
  ArrayMaxSize,
  ArrayMinSize,
  ValidateNested,
  IsInstance,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class Options {
  @ApiProperty()
  @IsDefined()
  @IsIn([1, 2, 3, 4])
  key: number;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @MinLength(1)
  value: string;
}

export class AddQuestionDto {
  @ApiProperty()
  @IsDefined()
  @IsString()
  @MinLength(3)
  title: string;

  @ApiProperty()
  @IsDefined()
  @IsArray()
  @ArrayMaxSize(4)
  @ArrayMinSize(4)
  @Type(() => Options)
  @ValidateNested({
    each: true,
  })
  @IsInstance(Options, {
    each: true,
  })
  options: Options[];

  @ApiProperty()
  @IsDefined()
  @IsNumber()
  @IsIn([1, 2, 3, 4])
  answerKey: number;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsIn(['practice', 'easy', 'medium', 'hard'])
  level: string;

  @ApiProperty()
  @IsDefined()
  tags: string[];
}
