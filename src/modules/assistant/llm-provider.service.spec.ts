import { ConfigService } from '@nestjs/config';
import { LlmProviderService } from './llm-provider.service';

describe('LlmProviderService', () => {
  it('generates deterministic mock answers from retrieved chunks', async () => {
    const service = new LlmProviderService({
      getOrThrow: jest.fn(() => ({ llmProvider: 'mock' })),
    } as unknown as ConfigService);

    await expect(
      service.generateAnswer({
        chunks: [
          {
            chunkIndex: 0,
            documentId: 'document-1',
            documentName: 'guide.txt',
            score: 2,
            text: 'Members receive diagnostics and clinical guidance.',
          },
          {
            chunkIndex: 1,
            documentId: 'document-1',
            documentName: 'guide.txt',
            score: 1,
            text: 'Follow-up appointments are scheduled after testing.',
          },
        ],
        question: 'What do members receive?',
      }),
    ).resolves.toContain('I found 2 relevant sections');
  });
});
