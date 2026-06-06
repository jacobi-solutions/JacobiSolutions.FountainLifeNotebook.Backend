import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';

export class DeleteDocumentResultDto {
  @ApiProperty()
  deleted!: boolean;
}

export class DeleteDocumentResponseDto extends BaseResponseDto<DeleteDocumentResultDto> {
  @ApiProperty({ type: DeleteDocumentResultDto })
  declare data?: DeleteDocumentResultDto;
}
