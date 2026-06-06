import { ApiProperty } from '@nestjs/swagger';
import { ErrorDto } from './error.dto';

export class BaseResponseDto<TData = unknown> {
  @ApiProperty({ required: false })
  correlationId?: string;

  @ApiProperty({ type: [ErrorDto] })
  errors: ErrorDto[] = [];

  @ApiProperty({ type: Boolean })
  isSuccess = true;

  @ApiProperty({ required: false })
  data?: TData;
}
