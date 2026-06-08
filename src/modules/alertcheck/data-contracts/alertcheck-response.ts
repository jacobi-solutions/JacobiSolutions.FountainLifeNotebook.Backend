import { ApiProperty } from '@nestjs/swagger';

export class AlertcheckResponse {
  @ApiProperty()
  messageId!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: ['sent'] })
  status!: 'sent';

  @ApiProperty()
  timestamp!: string;
}
