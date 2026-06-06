import { Injectable } from '@nestjs/common';
import { AssistantService } from '../../assistants/assistant.service';
import { McpToolContext } from '../mcp-tool-context';
import { McpToolHandler } from '../mcp-tool-handler';
import { McpToolExecutionResult } from '../mcp-tool-execution-result';

@Injectable()
export class ListAssistantsTool implements McpToolHandler {
  readonly description = 'Lists the assistants available in this Fountain Life Notebook application.';
  readonly inputSchema = {
    additionalProperties: false,
    properties: {},
    type: 'object',
  };
  readonly name = 'fountainLife.assistants.list';

  constructor(private readonly assistantService: AssistantService) {}

  async execute(_argumentsPayload: Record<string, unknown>, _context: McpToolContext): Promise<McpToolExecutionResult> {
    const assistants = this.assistantService.listAssistants();

    return {
      structuredContent: { assistants },
      text: `Found ${assistants.length} assistant(s).`,
    };
  }
}
