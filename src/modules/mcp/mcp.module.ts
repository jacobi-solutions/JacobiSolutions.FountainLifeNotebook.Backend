import { Module } from '@nestjs/common';
import { AssistantModule } from '../assistant/assistant.module';
import { McpController } from './mcp.controller';
import { McpToolHandler } from './mcp-tool-handler';
import { McpToolRegistry } from './mcp-tool-registry';
import { ListAssistantsTool } from './tools/list-assistants.tool';

const mcpTools = [ListAssistantsTool];

@Module({
  imports: [AssistantModule],
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
