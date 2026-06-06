import { ApiProperty } from '@nestjs/swagger';
import { Citation } from './citation';

export class AssistantConversationMessage {
  @ApiProperty({ required: false })
  actorDisplayName?: string;

  @ApiProperty({ required: false })
  actorUserId?: string;

  @ApiProperty({ required: false, type: [Citation] })
  citations?: Citation[];

  @ApiProperty()
  createdDateUtc!: Date;

  @ApiProperty()
  id!: string;

  @ApiProperty({ enum: ['assistant', 'system', 'tool', 'user'] })
  role!: 'assistant' | 'system' | 'tool' | 'user';

  @ApiProperty()
  text!: string;
}
