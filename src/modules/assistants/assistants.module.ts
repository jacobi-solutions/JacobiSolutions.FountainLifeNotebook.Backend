import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from '../documents/documents.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { NotebooksModule } from '../notebooks/notebooks.module';
import {
  AssistantConversation,
  AssistantConversationSchema,
} from './schemas/assistant-conversation.schema';
import { AssistantConversationsRepository } from './assistant-conversations.repository';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { ASSISTANT_HANDLERS } from './assistant-handler';
import { AssistantRegistry } from './assistant-registry';
import { LlmProviderService } from './notebook-assistant/llm-provider.service';
import { NotebookAgentService } from './notebook-assistant/notebook-agent.service';
import { NotebookAssistantHandler } from './notebook-assistant/notebook-assistant.handler';
import { NotebookRetrievalService } from './notebook-assistant/notebook-retrieval.service';

@Module({
  imports: [
    DocumentsModule,
    KnowledgeBaseModule,
    NotebooksModule,
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
export class AssistantsModule {}
