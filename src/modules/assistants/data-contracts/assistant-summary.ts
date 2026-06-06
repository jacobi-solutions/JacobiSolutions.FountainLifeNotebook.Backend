import { ApiProperty } from '@nestjs/swagger';

export class AssistantSummary {
  @ApiProperty()
  description!: string;

  @ApiProperty()
  key!: string;

  @ApiProperty()
  name!: string;
}
