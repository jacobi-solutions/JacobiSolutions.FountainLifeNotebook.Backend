import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequestDto } from '../../../shared/contracts/base-request.dto';

export class DeleteDocumentPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  documentId!: string;
}

export class DeleteDocumentRequestDto extends BaseRequestDto<DeleteDocumentPayloadDto> {
  @ApiProperty({ type: DeleteDocumentPayloadDto })
  @IsOptional()
  @Type(() => DeleteDocumentPayloadDto)
  @ValidateNested()
  declare payload?: DeleteDocumentPayloadDto;
}
