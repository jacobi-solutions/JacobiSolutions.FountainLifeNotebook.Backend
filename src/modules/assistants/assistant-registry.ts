import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ASSISTANT_HANDLERS, AssistantHandler } from './assistant-handler';

@Injectable()
export class AssistantRegistry {
  private readonly handlers: ReadonlyMap<string, AssistantHandler>;

  constructor(@Inject(ASSISTANT_HANDLERS) handlers: AssistantHandler[]) {
    this.handlers = new Map(
      handlers.map((handler) => [handler.summary.key, handler]),
    );
  }

  listSummaries() {
    return [...this.handlers.values()].map((handler) => handler.summary);
  }

  getOrThrow(assistantKey: string) {
    const handler = this.handlers.get(assistantKey);
    if (!handler) {
      throw new NotFoundException(`Assistant '${assistantKey}' was not found.`);
    }

    return handler;
  }
}
