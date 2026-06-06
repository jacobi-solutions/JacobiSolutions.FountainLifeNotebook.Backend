import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { DocumentDto } from './document.dto';

export class ListDocumentsResponseDto extends BaseResponseDto<DocumentDto[]> {
  @ApiProperty({ type: [DocumentDto] })
  declare data?: DocumentDto[];
}
