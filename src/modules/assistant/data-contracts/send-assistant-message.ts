import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class SendAssistantMessagePayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  message!: string;

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

export class SendAssistantMessageRequest extends BaseRequest<SendAssistantMessagePayload> {
  @ApiProperty({ type: SendAssistantMessagePayload })
  @IsOptional()
  @Type(() => SendAssistantMessagePayload)
  @ValidateNested()
  declare payload?: SendAssistantMessagePayload;
}
