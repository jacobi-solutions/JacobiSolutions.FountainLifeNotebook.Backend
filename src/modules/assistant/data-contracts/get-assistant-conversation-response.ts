import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantConversation } from './assistant-conversation';

export class GetAssistantConversationResponse extends BaseResponse<AssistantConversation> {
  @ApiProperty({ type: AssistantConversation })
  declare data?: AssistantConversation;
}
