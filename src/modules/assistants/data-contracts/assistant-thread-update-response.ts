import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AssistantThreadUpdate } from './assistant-thread-update';

export class AssistantThreadUpdateResponse extends BaseResponse {
  @ApiProperty({ type: AssistantThreadUpdate })
  update!: AssistantThreadUpdate;
}
