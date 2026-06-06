import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantSummary } from './assistant-summary';

export class ListAssistantsResponse extends BaseResponse<AssistantSummary[]> {
  @ApiProperty({ type: [AssistantSummary] })
  declare data?: AssistantSummary[];
}
