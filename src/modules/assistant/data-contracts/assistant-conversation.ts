import { ApiProperty } from '@nestjs/swagger';
import { AssistantConversationMessage } from './assistant-conversation-message';
import { AssistantConversationParticipant } from './assistant-conversation-participant';

export class AssistantConversation {
  @ApiProperty()
  assistantKey!: string;

  @ApiProperty({ format: 'date-time' })
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [AssistantConversationMessage] })
  messages!: AssistantConversationMessage[];

  @ApiProperty({ type: [AssistantConversationParticipant] })
  participants!: AssistantConversationParticipant[];

  @ApiProperty({ format: 'date-time' })
  lastUpdatedDateUtc!: Date;
}
