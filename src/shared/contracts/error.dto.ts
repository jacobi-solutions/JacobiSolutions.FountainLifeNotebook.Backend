import { ApiProperty } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty()
  errorMessage!: string;

  @ApiProperty({ required: false })
  errorCode?: string;
}
