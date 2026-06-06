import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantConversation } from './assistant-conversation';

export class GetAssistantConversationResponse extends BaseResponse {
  @ApiProperty({ type: AssistantConversation })
  conversation!: AssistantConversation;
}
