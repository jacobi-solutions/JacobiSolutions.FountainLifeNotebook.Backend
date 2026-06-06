import { ApiProperty } from '@nestjs/swagger';
import { ErrorInfo } from './error-info';

export class BaseResponse {
  @ApiProperty({ required: false })
  correlationId?: string;

  @ApiProperty({ type: [ErrorInfo] })
  errors: ErrorInfo[] = [];

  @ApiProperty({ type: Boolean })
  isSuccess = true;

}
