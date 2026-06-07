import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';
import { LlmProviderService } from './llm-provider.service';

describe('LlmProviderService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns a grounded mock answer when the mock provider is configured', async () => {
    const service = new LlmProviderService(
      createConfigService(
        {
          llmProvider: 'mock',
          bedrockModelId: '',
        },
        false,
      ),
    );

    await expect(
      service.generateAnswer({
        chunks: [
          {
            chunkIndex: 0,
            documentId: 'document-1',
            documentName: 'plan.txt',
            score: 1,
            text: 'Complete onboarding before diagnostics.',
          },
        ],
        question: 'What happens first?',
      }),
    ).resolves.toContain('Complete onboarding before diagnostics.');
  });

  it('invokes Bedrock Converse with document context when Bedrock is configured', async () => {
    const send = jest
      .spyOn(BedrockRuntimeClient.prototype, 'send')
      .mockResolvedValue({
        output: {
          message: {
            content: [{ text: 'Complete onboarding first. [1]' }],
          },
        },
      } as never);
    const service = new LlmProviderService(
      createConfigService({
        llmProvider: 'bedrock',
        bedrockModelId: 'amazon.nova-lite-v1:0',
      }),
    );

    await expect(
      service.generateAnswer({
        chunks: [
          {
            chunkIndex: 0,
            documentId: 'document-1',
            documentName: 'plan.txt',
            score: 1,
            text: 'Complete onboarding before diagnostics.',
          },
        ],
        question: 'What happens first?',
      }),
    ).resolves.toBe('Complete onboarding first. [1]');

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0] as ConverseCommand;
    expect(command.input.modelId).toBe('amazon.nova-lite-v1:0');
    expect(command.input.messages?.[0].content?.[0].text).toContain(
      'Complete onboarding before diagnostics.',
    );
  });
});

function createConfigService(llm: {
  bedrockModelId: string;
  llmProvider: 'bedrock' | 'mock';
}, includeAws = true) {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'aws' && includeAws) {
        return { region: 'us-east-1' };
      }

      if (key === 'llm') {
        return llm;
      }

      throw new Error(`Unexpected config key: ${key}`);
    }),
  } as unknown as ConfigService;
}
