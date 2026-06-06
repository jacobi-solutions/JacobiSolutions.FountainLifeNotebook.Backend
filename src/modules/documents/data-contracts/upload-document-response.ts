import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { DocumentSummary } from './document-summary';

export class UploadDocumentResponse extends BaseResponse {
  @ApiProperty({ type: DocumentSummary })
  document!: DocumentSummary;
}
