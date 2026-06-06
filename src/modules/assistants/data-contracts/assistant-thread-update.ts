import { ApiProperty } from '@nestjs/swagger';
import { Citation } from './citation';

export class AssistantThreadUpdate {
  @ApiProperty({ required: false, type: [Citation] })
  citations?: Citation[];

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
