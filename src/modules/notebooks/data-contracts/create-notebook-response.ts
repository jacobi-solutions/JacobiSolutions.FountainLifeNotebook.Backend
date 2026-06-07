import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { NotebookSummary } from './notebook-summary';

export class CreateNotebookResponse extends BaseResponse {
  @ApiProperty({ type: NotebookSummary })
  notebook!: NotebookSummary;
}
