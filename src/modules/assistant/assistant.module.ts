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
import { ASSISTANT_HANDLERS } from './assistant-handler';
import { AssistantRegistry } from './assistant-registry';
import { LlmProviderService } from './llm-provider.service';
import { NotebookAgentService } from './notebook-agent.service';
import { NotebookAssistantHandler } from './notebook-assistant.handler';
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
    AssistantRegistry,
    LlmProviderService,
    NotebookAgentService,
    NotebookAssistantHandler,
    NotebookRetrievalService,
    {
      inject: [NotebookAssistantHandler],
      provide: ASSISTANT_HANDLERS,
      useFactory: (notebookAssistant: NotebookAssistantHandler) => [
        notebookAssistant,
      ],
    },
  ],
  exports: [AssistantService],
})
export class AssistantModule {}
