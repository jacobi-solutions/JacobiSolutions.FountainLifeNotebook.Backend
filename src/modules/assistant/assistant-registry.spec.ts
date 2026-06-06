import { NotFoundException } from '@nestjs/common';
import { AssistantHandler } from './assistant-handler';
import { AssistantRegistry } from './assistant-registry';
import { NOTEBOOK_ASSISTANT_KEY } from './assistant.constants';

describe('AssistantRegistry', () => {
  it('lists and resolves registered assistant handlers by key', () => {
    const handler = {
      answerQuestion: jest.fn(),
      summary: {
        description: 'Ask questions grounded in documents.',
        key: NOTEBOOK_ASSISTANT_KEY,
        name: 'Notebook Assistant',
      },
    } as unknown as AssistantHandler;
    const registry = new AssistantRegistry([handler]);

    expect(registry.listSummaries()).toEqual([handler.summary]);
    expect(registry.getOrThrow(NOTEBOOK_ASSISTANT_KEY)).toBe(handler);
  });

  it('throws a not-found exception for unknown assistant keys', () => {
    const registry = new AssistantRegistry([]);

    expect(() => registry.getOrThrow('missing')).toThrow(NotFoundException);
  });
});
