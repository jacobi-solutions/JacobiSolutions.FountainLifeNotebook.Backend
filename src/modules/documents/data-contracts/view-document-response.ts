import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { DocumentDetail } from './document-detail';

export class ViewDocumentResponse extends BaseResponse {
  @ApiProperty({ type: DocumentDetail })
  document!: DocumentDetail;
}
