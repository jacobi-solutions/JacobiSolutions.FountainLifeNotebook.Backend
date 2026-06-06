import { ApiProperty } from '@nestjs/swagger';

export class ErrorInfo {
  @ApiProperty()
  errorMessage!: string;

  @ApiProperty({ required: false })
  errorCode?: string;
}
