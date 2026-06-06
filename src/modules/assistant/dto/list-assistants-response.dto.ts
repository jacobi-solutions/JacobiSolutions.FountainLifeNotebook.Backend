import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { AssistantSummaryDto } from './assistant-summary.dto';

export class ListAssistantsResponseDto extends BaseResponseDto<AssistantSummaryDto[]> {
  @ApiProperty({ type: [AssistantSummaryDto] })
  declare data?: AssistantSummaryDto[];
}
