import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class UpdateNotebookRequest extends BaseRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notebookId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;
}
