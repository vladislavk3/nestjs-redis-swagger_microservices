import { IsDefined, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IBulkUpdatePoints } from '../../account/account.service';

// totalScore
//  - id
//  - correct
//  - wrong
//  - unanswered
export class UpdateLeaderBoard {
  @ApiProperty()
  @IsDefined()
  readonly quizid: string;

  @ApiProperty()
  @IsDefined()
  @IsArray()
  readonly winners: IBulkUpdatePoints[];

  @ApiProperty()
  @IsDefined()
  @IsArray()
  readonly qstats: any[];
}
