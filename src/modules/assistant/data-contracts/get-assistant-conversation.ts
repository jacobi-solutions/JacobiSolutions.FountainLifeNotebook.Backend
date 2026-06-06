import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class GetAssistantConversationPayload {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  conversationId!: string;
}

export class GetAssistantConversationRequest extends BaseRequest<GetAssistantConversationPayload> {
  @ApiProperty({ type: GetAssistantConversationPayload })
  @IsOptional()
  @Type(() => GetAssistantConversationPayload)
  @ValidateNested()
  declare payload?: GetAssistantConversationPayload;
}
