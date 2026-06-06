import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantThreadUpdate } from './assistant-thread-update';

export class AssistantThreadUpdateResponse extends BaseResponse<AssistantThreadUpdate> {
  @ApiProperty({ type: AssistantThreadUpdate })
  declare data?: AssistantThreadUpdate;
}
