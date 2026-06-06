import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  AssistantConversation,
  AssistantConversationSchema,
} from './schemas/assistant-conversation.schema';
import { AssistantConversationsRepository } from './assistant-conversations.repository';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AssistantConversation.name, schema: AssistantConversationSchema },
    ]),
  ],
  controllers: [AssistantController],
  providers: [AssistantConversationsRepository, AssistantService],
  exports: [AssistantService],
})
export class AssistantModule {}
