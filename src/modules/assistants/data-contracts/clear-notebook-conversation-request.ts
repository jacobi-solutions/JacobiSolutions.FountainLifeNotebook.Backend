import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { BaseRequest } from '../../../shared/data-contracts/base-request';

export class ClearNotebookConversationRequest extends BaseRequest {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  notebookId!: string;
}
