export interface McpToolExecutionResult {
  isError?: boolean;
  structuredContent?: Record<string, unknown>;
  text: string;
}

export function mcpToolError(text: string): McpToolExecutionResult {
  return {
    isError: true,
    text,
  };
}
