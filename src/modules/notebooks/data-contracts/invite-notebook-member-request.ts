import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsString } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';
import {
  NOTEBOOK_MEMBER_ROLES,
  type NotebookMemberRole,
} from '../schemas/notebook.schema';

export class InviteNotebookMemberRequest extends BaseRequest {
  @ApiProperty()
  @IsEmail()
  email!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notebookId!: string;

  @ApiProperty({ enum: NOTEBOOK_MEMBER_ROLES })
  @IsIn(NOTEBOOK_MEMBER_ROLES)
  role!: NotebookMemberRole;
}
