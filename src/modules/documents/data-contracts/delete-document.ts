import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class DeleteDocumentPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentId!: string;
}

export class DeleteDocumentRequest extends BaseRequest<DeleteDocumentPayload> {
  @ApiProperty({ type: DeleteDocumentPayload })
  @IsOptional()
  @Type(() => DeleteDocumentPayload)
  @ValidateNested()
  declare payload?: DeleteDocumentPayload;
}
