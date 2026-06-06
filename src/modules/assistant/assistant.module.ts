import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from '../documents/documents.module';
import {
  AssistantConversation,
  AssistantConversationSchema,
} from './schemas/assistant-conversation.schema';
import { AssistantConversationsRepository } from './assistant-conversations.repository';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { LlmProviderService } from './llm-provider.service';
import { NotebookAgentService } from './notebook-agent.service';
import { NotebookRetrievalService } from './notebook-retrieval.service';

@Module({
  imports: [
    DocumentsModule,
    MongooseModule.forFeature([
      { name: AssistantConversation.name, schema: AssistantConversationSchema },
    ]),
  ],
  controllers: [AssistantController],
  providers: [
    AssistantConversationsRepository,
    AssistantService,
    LlmProviderService,
    NotebookAgentService,
    NotebookRetrievalService,
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
