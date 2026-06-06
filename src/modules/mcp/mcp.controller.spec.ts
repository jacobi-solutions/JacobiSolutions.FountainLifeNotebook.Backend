import { McpController } from './mcp.controller';
import { McpToolRegistry } from './mcp-tool-registry';

describe('McpController', () => {
  it('lists registered tools through JSON-RPC', async () => {
    const registry = {
      list: jest.fn(() => [
        {
          description: 'Lists assistants.',
          inputSchema: { type: 'object' },
          name: 'fountainLife.assistants.list',
        },
      ]),
    } as unknown as McpToolRegistry;
    const controller = new McpController(registry);

    await expect(
      controller.handleMcpRequest(
        {
          id: 'request-1',
          jsonrpc: '2.0',
          method: 'tools/list',
        },
        { email: 'user@example.com', subject: 'user-1', username: 'User' },
      ),
    ).resolves.toEqual({
      id: 'request-1',
      jsonrpc: '2.0',
      result: {
        tools: [
          {
            description: 'Lists assistants.',
            inputSchema: { type: 'object' },
            name: 'fountainLife.assistants.list',
          },
        ],
      },
    });
  });

  it('calls tools and returns MCP tool result content', async () => {
    const tool = {
      execute: jest.fn(async () => ({
        structuredContent: { value: 1 },
        text: 'Done.',
      })),
    };
    const registry = {
      get: jest.fn(() => tool),
    } as unknown as McpToolRegistry;
    const controller = new McpController(registry);

    await expect(
      controller.handleMcpRequest(
        {
          id: 2,
          jsonrpc: '2.0',
          method: 'tools/call',
          params: {
            arguments: {},
            name: 'fountainLife.assistants.list',
          },
        },
        { email: 'user@example.com', subject: 'user-1', username: 'User' },
      ),
    ).resolves.toEqual({
      id: 2,
      jsonrpc: '2.0',
      result: {
        content: [
          {
            text: 'Done.',
            type: 'text',
          },
        ],
        isError: false,
        structuredContent: { value: 1 },
      },
    });
    expect(tool.execute).toHaveBeenCalledWith(
      {},
      {
        user: {
          email: 'user@example.com',
          subject: 'user-1',
          username: 'User',
        },
      },
    );
  });
});
