import { McpToolContext } from './mcp-tool-context';
import { McpToolExecutionResult } from './mcp-tool-execution-result';

export interface McpToolHandler {
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly name: string;

  execute(argumentsPayload: Record<string, unknown>, context: McpToolContext): Promise<McpToolExecutionResult>;
}
