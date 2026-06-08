import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantConversation } from './assistant-conversation';

export class GetNotebookConversationResponse extends BaseResponse {
  @ApiProperty({ required: false, type: AssistantConversation })
  conversation?: AssistantConversation;
}
