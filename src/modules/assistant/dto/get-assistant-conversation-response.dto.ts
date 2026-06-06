import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { AssistantConversationDto } from './assistant-conversation.dto';

export class GetAssistantConversationResponseDto extends BaseResponseDto<AssistantConversationDto> {
  @ApiProperty({ type: AssistantConversationDto })
  declare data?: AssistantConversationDto;
}
