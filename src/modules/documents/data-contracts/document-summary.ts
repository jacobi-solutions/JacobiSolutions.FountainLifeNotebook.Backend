import { ApiProperty } from '@nestjs/swagger';
import { DOCUMENT_PROCESSING_STATUSES } from '../document.constants';
import type { DocumentProcessingStatus } from '../document.constants';

export class DocumentSummary {
  @ApiProperty()
  byteSize!: number;

  @ApiProperty()
  chunkCount!: number;

  @ApiProperty()
  contentType!: string;

  @ApiProperty()
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty()
  lastUpdatedDateUtc!: Date;

  @ApiProperty()
  notebookId!: string;

  @ApiProperty()
  originalFileName!: string;

  @ApiProperty({ enum: DOCUMENT_PROCESSING_STATUSES })
  status!: DocumentProcessingStatus;

  @ApiProperty({ required: false })
  textPreview?: string;

  @ApiProperty({ required: false })
  knowledgeBaseStatusReason?: string;
}
