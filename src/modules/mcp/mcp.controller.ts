import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { mcpToolError } from './mcp-tool-execution-result';
import { McpToolRegistry } from './mcp-tool-registry';

interface JsonRpcRequest {
  id?: string | number | null;
  jsonrpc?: string;
  method?: string;
  params?: Record<string, unknown>;
}

@ApiBearerAuth()
@ApiTags('mcp')
@UseGuards(AuthenticatedUserGuard)
@Controller('mcp')
export class McpController {
  constructor(private readonly toolRegistry: McpToolRegistry) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiBody({ schema: { type: 'object' } })
  @ApiOkResponse({
    description: 'JSON-RPC 2.0 response for the MCP streamable HTTP transport.',
  })
  async handleMcpRequest(
    @Body() request: JsonRpcRequest,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    if (!request || typeof request !== 'object') {
      return this.buildError(null, -32600, 'Invalid request.');
    }

    switch (request.method) {
      case 'initialize':
        return this.buildSuccess(request.id, {
          capabilities: {
            tools: {
              listChanged: false,
            },
          },
          protocolVersion: '2025-03-26',
          serverInfo: {
            name: 'FountainLifeNotebook MCP',
            version: '0.1.0',
          },
        });
      case 'notifications/initialized':
        return this.buildSuccess(request.id, {});
      case 'tools/list':
        return this.buildSuccess(request.id, {
          tools: this.toolRegistry.list().map((tool) => ({
            description: tool.description,
            inputSchema: tool.inputSchema,
            name: tool.name,
          })),
        });
      case 'tools/call':
        return this.buildSuccess(
          request.id,
          await this.callTool(request.params ?? {}, user),
        );
      default:
        return this.buildError(request.id, -32601, 'Method not found.');
    }
  }

  private async callTool(
    params: Record<string, unknown>,
    user: AuthenticatedUser,
  ) {
    const name = typeof params.name === 'string' ? params.name : '';
    const tool = this.toolRegistry.get(name);
    if (!tool) {
      return this.buildToolResult(mcpToolError('Tool was not found.'));
    }

    const argumentsPayload =
      params.arguments &&
      typeof params.arguments === 'object' &&
      !Array.isArray(params.arguments)
        ? (params.arguments as Record<string, unknown>)
        : {};

    try {
      return this.buildToolResult(
        await tool.execute(argumentsPayload, { user }),
      );
    } catch (error) {
      return this.buildToolResult(
        mcpToolError(
          error instanceof Error ? error.message : 'Tool call failed.',
        ),
      );
    }
  }

  private buildToolResult(result: {
    isError?: boolean;
    structuredContent?: Record<string, unknown>;
    text: string;
  }) {
    return {
      content: [
        {
          text: result.text,
          type: 'text',
        },
      ],
      isError: result.isError ?? false,
      structuredContent: result.structuredContent,
    };
  }

  private buildSuccess(
    id: JsonRpcRequest['id'],
    result: Record<string, unknown>,
  ) {
    return {
      id: id ?? null,
      jsonrpc: '2.0',
      result,
    };
  }

  private buildError(id: JsonRpcRequest['id'], code: number, message: string) {
    return {
      error: {
        code,
        message,
      },
      id: id ?? null,
      jsonrpc: '2.0',
    };
  }
}
