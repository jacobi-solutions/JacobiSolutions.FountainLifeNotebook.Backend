import { ApiProperty } from '@nestjs/swagger';
import { CitationDto } from './citation.dto';

export class AssistantConversationMessageDto {
  @ApiProperty({ required: false })
  actorDisplayName?: string;

  @ApiProperty({ required: false })
  actorUserId?: string;

  @ApiProperty({ required: false, type: [CitationDto] })
  citations?: CitationDto[];

  @ApiProperty()
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['assistant', 'system', 'tool', 'user'] })
  role!: 'assistant' | 'system' | 'tool' | 'user';

  @ApiProperty()
  text!: string;
}
