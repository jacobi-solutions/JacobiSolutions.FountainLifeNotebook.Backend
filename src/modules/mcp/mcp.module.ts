import { Module } from '@nestjs/common';
import { AssistantModule } from '../assistant/assistant.module';
import { SupportRequestsModule } from '../support-requests/support-requests.module';
import { McpController } from './mcp.controller';
import { McpToolHandler } from './mcp-tool-handler';
import { McpToolRegistry } from './mcp-tool-registry';
import { CreateSupportRequestTool } from './tools/create-support-request.tool';
import { ListAssistantsTool } from './tools/list-assistants.tool';

const mcpTools = [CreateSupportRequestTool, ListAssistantsTool];

@Module({
  imports: [AssistantModule, SupportRequestsModule],
  controllers: [McpController],
  providers: [
    ...mcpTools,
    {
      inject: mcpTools,
      provide: McpToolRegistry,
      useFactory: (...tools: McpToolHandler[]) => new McpToolRegistry(tools),
    },
  ],
})
export class McpModule {}
