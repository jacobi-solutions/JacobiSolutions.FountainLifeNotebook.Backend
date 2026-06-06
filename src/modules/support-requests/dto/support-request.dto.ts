import { ApiProperty } from '@nestjs/swagger';

export class SupportRequestDto {
  @ApiProperty()
  category!: string;

  @ApiProperty()
  createdByUserId!: string;

  @ApiProperty({ format: 'date-time' })
  createdDateUtc!: Date;

  @ApiProperty()
  description!: string;

  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['high', 'low', 'normal'] })
  priority!: 'high' | 'low' | 'normal';

  @ApiProperty({ enum: ['open', 'resolved'] })
  status!: 'open' | 'resolved';

  @ApiProperty()
  subject!: string;
}
