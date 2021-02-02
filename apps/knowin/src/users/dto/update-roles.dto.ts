import { IsDefined, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role, Status } from 'knowin/common';

export class UpdateUserRoleDto {
  @ApiProperty()
  @IsDefined()
  readonly userid: string;

  @ApiProperty()
  @IsString()
  readonly role: Role;

  @ApiProperty()
  @IsString()
  readonly status: Status;
}
