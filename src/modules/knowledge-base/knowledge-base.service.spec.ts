import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { ConfigService } from '@nestjs/config';
import { KnowledgeBaseService } from './knowledge-base.service';

describe('KnowledgeBaseService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('uses a single notebook filter when no documents are selected', async () => {
    const send = mockRetrieveAndGenerate();
    const service = new KnowledgeBaseService(createConfigService());

    await service.answerQuestion({
      message: 'What should I know?',
      notebookId: 'notebook-1',
      ownerUserId: 'user-1',
    });

    expect(readFilter(send)).toEqual({
      equals: {
        key: 'notebookId',
        value: 'notebook-1',
      },
    });
  });

  it('uses direct equals filters when one document is selected', async () => {
    const send = mockRetrieveAndGenerate();
    const service = new KnowledgeBaseService(createConfigService());

    await service.answerQuestion({
      documentIds: ['document-1'],
      message: 'What should I know?',
      notebookId: 'notebook-1',
      ownerUserId: 'user-1',
    });

    expect(readFilter(send)).toEqual({
      andAll: [
        {
          equals: {
            key: 'notebookId',
            value: 'notebook-1',
          },
        },
        {
          equals: {
            key: 'documentId',
            value: 'document-1',
          },
        },
      ],
    });
  });

  it('uses orAll only when multiple documents are selected', async () => {
    const send = mockRetrieveAndGenerate();
    const service = new KnowledgeBaseService(createConfigService());

    await service.answerQuestion({
      documentIds: ['document-1', 'document-2'],
      message: 'What should I know?',
      notebookId: 'notebook-1',
      ownerUserId: 'user-1',
    });

    expect(readFilter(send)).toEqual({
      andAll: [
        {
          equals: {
            key: 'notebookId',
            value: 'notebook-1',
          },
        },
        {
          orAll: [
            {
              equals: {
                key: 'documentId',
                value: 'document-1',
              },
            },
            {
              equals: {
                key: 'documentId',
                value: 'document-2',
              },
            },
          ],
        },
      ],
    });
  });
});

function mockRetrieveAndGenerate() {
  return jest
    .spyOn(BedrockAgentRuntimeClient.prototype, 'send')
    .mockResolvedValue({
      output: { text: 'Knowledge base answer.' },
    } as never);
}

function readFilter(send: jest.SpiedFunction<BedrockAgentRuntimeClient['send']>) {
  const command = send.mock.calls[0][0] as RetrieveAndGenerateCommand;
  return command.input.retrieveAndGenerateConfiguration
    ?.knowledgeBaseConfiguration?.retrievalConfiguration
    ?.vectorSearchConfiguration?.filter;
}

function createConfigService() {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'aws') {
        return { region: 'us-east-1' };
      }

      if (key === 'llm') {
        return {
          bedrockModelId: 'amazon.nova-lite-v1:0',
          llmProvider: 'bedrock',
        };
      }

      if (key === 'retrieval') {
        return {
          bedrockDataSourceId: 'data-source-1',
          bedrockKnowledgeBaseId: 'knowledge-base-1',
          bedrockKnowledgeBaseModelArn:
            'arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0',
          retrievalProvider: 'bedrock-kb',
        };
      }

      throw new Error(`Unexpected config key: ${key}`);
    }),
  } as unknown as ConfigService;
}
