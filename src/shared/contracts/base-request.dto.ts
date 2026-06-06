import { ApiProperty } from '@nestjs/swagger';
import { Allow, IsOptional, IsString } from 'class-validator';

export class BaseRequestDto<TPayload = unknown> {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiProperty({ required: false })
  @Allow()
  @IsOptional()
  payload?: TPayload;
}
