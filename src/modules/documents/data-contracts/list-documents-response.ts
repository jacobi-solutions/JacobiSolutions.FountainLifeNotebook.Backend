import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { DocumentSummary } from './document-summary';

export class ListDocumentsResponse extends BaseResponse<DocumentSummary[]> {
  @ApiProperty({ type: [DocumentSummary] })
  declare data?: DocumentSummary[];
}
