import { ApiProperty } from '@nestjs/swagger';
import { AssistantConversationMessageDto } from './assistant-conversation-message.dto';
import { AssistantConversationParticipantDto } from './assistant-conversation-participant.dto';

export class AssistantConversationDto {
  @ApiProperty()
  assistantKey!: string;

  @ApiProperty({ format: 'date-time' })
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty({ type: [AssistantConversationMessageDto] })
  messages!: AssistantConversationMessageDto[];

  @ApiProperty({ type: [AssistantConversationParticipantDto] })
  participants!: AssistantConversationParticipantDto[];

  @ApiProperty({ format: 'date-time' })
  lastUpdatedDateUtc!: Date;
}
