import { ApiProperty } from '@nestjs/swagger';

export class DocumentDto {
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
  originalFileName!: string;

  @ApiProperty({ enum: ['failed', 'ready'] })
  status!: 'failed' | 'ready';

  @ApiProperty({ required: false })
  textPreview?: string;
}
