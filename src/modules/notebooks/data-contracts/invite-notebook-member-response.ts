import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { NotebookSummary } from './notebook-summary';

export class InviteNotebookMemberResponse extends BaseResponse {
  @ApiProperty()
  inviteDelivery!: 'cognito' | 'local' | 'existing-user';

  @ApiProperty({ type: NotebookSummary })
  notebook!: NotebookSummary;
}
