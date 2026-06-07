import { ApiProperty } from '@nestjs/swagger';
import {
  NOTEBOOK_MEMBER_ROLES,
  NOTEBOOK_MEMBER_STATUSES,
  type NotebookMemberRole,
  type NotebookMemberStatus,
} from '../schemas/notebook.schema';

export class NotebookMemberSummary {
  @ApiProperty({ required: false })
  email?: string;

  @ApiProperty({ enum: NOTEBOOK_MEMBER_ROLES })
  role!: NotebookMemberRole;

  @ApiProperty({ enum: NOTEBOOK_MEMBER_STATUSES })
  status!: NotebookMemberStatus;

  @ApiProperty({ required: false })
  userId?: string;
}
