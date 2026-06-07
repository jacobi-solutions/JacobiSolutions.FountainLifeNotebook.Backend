import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class SendAssistantMessageRequest extends BaseRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notebookId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  documentIds?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  participantUserIds?: string[];
}
