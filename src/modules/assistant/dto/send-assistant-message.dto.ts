import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequestDto } from '../../../shared/contracts/base-request.dto';

export class SendAssistantMessagePayloadDto {
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

export class SendAssistantMessageDto extends BaseRequestDto<SendAssistantMessagePayloadDto> {
  @ApiProperty({ type: SendAssistantMessagePayloadDto })
  @IsOptional()
  @Type(() => SendAssistantMessagePayloadDto)
  @ValidateNested()
  declare payload?: SendAssistantMessagePayloadDto;
}
