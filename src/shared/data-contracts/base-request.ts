import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BaseRequest {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  correlationId?: string;
}
