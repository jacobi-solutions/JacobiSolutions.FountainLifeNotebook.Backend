import { ApiProperty } from '@nestjs/swagger';

export class AssistantSummaryDto {
  @ApiProperty()
  description!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  name!: string;
}
