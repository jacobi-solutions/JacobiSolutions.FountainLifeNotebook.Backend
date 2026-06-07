import { Module } from '@nestjs/common';
import { AccountsController } from './modules/accounts/accounts.controller';
import { AssistantController } from './modules/assistants/assistant.controller';
import { DocumentsController } from './modules/documents/documents.controller';
import { HealthController } from './modules/health/health.controller';
import { AccountsService } from './modules/accounts/accounts.service';
import { AssistantService } from './modules/assistants/assistant.service';
import { DocumentsService } from './modules/documents/documents.service';
import { McpController } from './modules/mcp/mcp.controller';
import { McpToolRegistry } from './modules/mcp/mcp-tool-registry';
import { NotebooksController } from './modules/notebooks/notebooks.controller';
import { NotebooksService } from './modules/notebooks/notebooks.service';

@Module({
  controllers: [AccountsController, AssistantController, DocumentsController, HealthController, McpController, NotebooksController],
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
        viewDocument: () => null,
      },
    },
    {
      provide: NotebooksService,
      useValue: {
        assertNotebookAccess: () => null,
        assertNotebookDocumentManageAccess: () => null,
        assertNotebookWriteAccess: () => null,
        createNotebook: () => null,
        deleteNotebook: () => null,
        inviteNotebookMember: () => null,
        listNotebooks: () => [],
        updateNotebook: () => null,
      },
    },
  ],
})
export class ApiContractModule {}
