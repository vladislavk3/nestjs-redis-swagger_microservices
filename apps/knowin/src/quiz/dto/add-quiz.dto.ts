import { IsArray, IsDefined, IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddQuizDto {
  @ApiProperty({ type: 'date' })
  @ApiProperty()
  @IsDefined()
  readonly starttime: string;

  @ApiProperty()
  @IsDefined()
  readonly roomsize: number;

  @ApiProperty()
  @IsDefined()
  readonly winningprice: number;

  @ApiProperty()
  @IsDefined()
  readonly entryfee: number;

  //@ApiProperty()
  //@IsDefined()
  //@IsString()
  //@IsIn(['live', 'reward'])
  //readonly type: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  @IsIn(['question_win', 'game_win'])
  readonly reward_type: string;

  @ApiProperty()
  @IsDefined()
  @IsString()
  readonly category: string;

  @ApiProperty()
  @IsDefined()
  @IsArray()
  readonly questionlist: string[];

  @ApiProperty({ type: 'string', format: 'binary' })
  file: any;

  @ApiProperty()
  @IsDefined()
  file_url: string;
}
