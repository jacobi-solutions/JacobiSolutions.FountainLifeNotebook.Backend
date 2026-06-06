import { ApiProperty } from '@nestjs/swagger';

export class AssistantConversationMessageDto {
  @ApiProperty({ required: false })
  actorDisplayName?: string;

  @ApiProperty({ required: false })
  actorUserId?: string;

  @ApiProperty()
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['assistant', 'system', 'tool', 'user'] })
  role!: 'assistant' | 'system' | 'tool' | 'user';

  @ApiProperty()
  text!: string;
}
