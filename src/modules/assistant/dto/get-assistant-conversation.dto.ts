import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequestDto } from '../../../shared/contracts/base-request.dto';

export class GetAssistantConversationPayloadDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}

export class GetAssistantConversationRequestDto extends BaseRequestDto<GetAssistantConversationPayloadDto> {
  @ApiProperty({ type: GetAssistantConversationPayloadDto })
  @IsOptional()
  @Type(() => GetAssistantConversationPayloadDto)
  @ValidateNested()
  declare payload?: GetAssistantConversationPayloadDto;
}
