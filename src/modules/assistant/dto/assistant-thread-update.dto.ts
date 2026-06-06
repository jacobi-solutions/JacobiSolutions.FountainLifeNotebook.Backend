import { ApiProperty } from '@nestjs/swagger';

export class AssistantThreadUpdateDto {
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
