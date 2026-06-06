import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { AssistantThreadUpdateDto } from './assistant-thread-update.dto';

export class AssistantThreadUpdateResponseDto extends BaseResponseDto<AssistantThreadUpdateDto> {
  @ApiProperty({ type: AssistantThreadUpdateDto })
  declare data?: AssistantThreadUpdateDto;
}
