import { ApiProperty } from '@nestjs/swagger';
import { CitationDto } from './citation.dto';

export class AssistantThreadUpdateDto {
  @ApiProperty({ required: false, type: [CitationDto] })
  citations?: CitationDto[];

  @ApiProperty()
  conversationId!: string;

  @ApiProperty({ required: false })
  messageId?: string;

  @ApiProperty({ enum: ['assistant', 'system', 'user'] })
  role!: 'assistant' | 'system' | 'user';

  @ApiProperty()
  text!: string;

  @ApiProperty({ enum: ['message', 'status'] })
  type!: 'message' | 'status';
}
