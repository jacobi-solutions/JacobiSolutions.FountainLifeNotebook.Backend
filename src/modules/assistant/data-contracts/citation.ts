import { ApiProperty } from '@nestjs/swagger';

export class Citation {
  @ApiProperty()
  chunkIndex!: number;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  documentName!: string;

  @ApiProperty()
  snippet!: string;
}
