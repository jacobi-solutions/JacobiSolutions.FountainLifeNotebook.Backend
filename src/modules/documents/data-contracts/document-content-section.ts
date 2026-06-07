import { ApiProperty } from '@nestjs/swagger';

export class DocumentContentSection {
  @ApiProperty()
  chunkIndex!: number;

  @ApiProperty()
  text!: string;
}
