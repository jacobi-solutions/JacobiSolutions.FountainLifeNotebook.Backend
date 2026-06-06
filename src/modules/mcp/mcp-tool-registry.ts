import { Injectable } from '@nestjs/common';
import { McpToolHandler } from './mcp-tool-handler';

@Injectable()
export class McpToolRegistry {
  private readonly handlers: ReadonlyMap<string, McpToolHandler>;

  constructor(handlers: McpToolHandler[]) {
    this.handlers = new Map(handlers.map((handler) => [handler.name, handler]));
  }

  list() {
    return [...this.handlers.values()];
  }

  get(name: string) {
    return this.handlers.get(name);
  }
}
