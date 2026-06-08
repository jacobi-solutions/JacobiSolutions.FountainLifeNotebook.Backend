import { ApiProperty } from '@nestjs/swagger';
import {
  NOTEBOOK_MEMBER_ROLES,
  type NotebookMemberRole,
} from '../schemas/notebook.schema';
import { NotebookMemberSummary } from './notebook-member-summary';

export class NotebookSummary {
  @ApiProperty()
  category!: string;

  @ApiProperty({ format: 'date-time' })
  createdDateUtc!: Date;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [NotebookMemberSummary] })
  members!: NotebookMemberSummary[];

  @ApiProperty({ enum: NOTEBOOK_MEMBER_ROLES })
  role!: NotebookMemberRole;

  @ApiProperty({ format: 'date-time' })
  lastUpdatedDateUtc!: Date;

  @ApiProperty()
  sourceCount!: number;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  workspaceId!: string;
}
