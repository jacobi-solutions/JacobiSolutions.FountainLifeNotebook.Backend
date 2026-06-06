import { ApiProperty } from '@nestjs/swagger';

export class CitationDto {
  @ApiProperty()
  chunkIndex!: number;

  @ApiProperty()
  documentId!: string;

  @ApiProperty()
  documentName!: string;

  @ApiProperty()
  snippet!: string;
}
