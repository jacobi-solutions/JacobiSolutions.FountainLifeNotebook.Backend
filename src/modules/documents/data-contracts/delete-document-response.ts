import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';

export class DeleteDocumentResult {
  @ApiProperty()
  deleted!: boolean;
}

export class DeleteDocumentResponse extends BaseResponse<DeleteDocumentResult> {
  @ApiProperty({ type: DeleteDocumentResult })
  declare data?: DeleteDocumentResult;
}
