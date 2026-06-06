import { Module } from '@nestjs/common';
import { AccountsController } from './modules/accounts/accounts.controller';
import { AssistantController } from './modules/assistant/assistant.controller';
import { DocumentsController } from './modules/documents/documents.controller';
import { HealthController } from './modules/health/health.controller';
import { AccountsService } from './modules/accounts/accounts.service';
import { AssistantService } from './modules/assistant/assistant.service';
import { DocumentsService } from './modules/documents/documents.service';
import { McpController } from './modules/mcp/mcp.controller';
import { McpToolRegistry } from './modules/mcp/mcp-tool-registry';

@Module({
  controllers: [AccountsController, AssistantController, DocumentsController, HealthController, McpController],
  providers: [
    {
      provide: AssistantService,
      useValue: {
        getConversation: () => null,
        listAssistants: () => [],
        streamMessage: async function* () {},
      },
    },
    {
      provide: McpToolRegistry,
      useValue: {
        get: () => null,
        list: () => [],
      },
    },
    {
      provide: AccountsService,
      useValue: {
        getCurrentUser: () => null,
        registerCurrentUser: () => null,
      },
    },
    {
      provide: DocumentsService,
      useValue: {
        deleteDocument: () => null,
        listDocuments: () => [],
        uploadDocument: () => null,
      },
    },
  ],
})
export class ApiContractModule {}
