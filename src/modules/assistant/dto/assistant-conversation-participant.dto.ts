import { ApiProperty } from '@nestjs/swagger';

export class AssistantConversationParticipantDto {
  @ApiProperty({ required: false })
  displayName?: string;

  @ApiProperty({ format: 'date-time' })
  joinedDateUtc!: Date;

  @ApiProperty({ enum: ['member', 'owner'] })
  role!: 'member' | 'owner';

  @ApiProperty({ enum: ['active', 'removed'] })
  status!: 'active' | 'removed';

  @ApiProperty()
  userId!: string;
}
