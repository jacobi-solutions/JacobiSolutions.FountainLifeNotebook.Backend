import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';
import { LlmProviderService } from './llm-provider.service';
import { NotebookAgentService } from './notebook-agent.service';
import { NotebookRetrievalService } from './notebook-retrieval.service';

describe('NotebookAgentService', () => {
  it('returns a grounded fallback when no chunks match the question', async () => {
    const llmProvider = {
      generateAnswer: jest.fn(),
    } as unknown as LlmProviderService;
    const service = new NotebookAgentService(
      {
        retrieve: jest.fn(async () => []),
      } as unknown as NotebookRetrievalService,
      llmProvider,
      disabledKnowledgeBaseService(),
    );

    const answer = await service.answerQuestion(
      'What is the care plan?',
      'user-1',
      'notebook-1',
    );

    expect(answer.citations).toEqual([]);
    expect(answer.answer).toContain('could not find relevant content');
    expect(llmProvider.generateAnswer).not.toHaveBeenCalled();
  });

  it('returns model answers with citation metadata from retrieved chunks', async () => {
    const chunks = [
      {
        chunkIndex: 0,
        documentId: 'document-1',
        documentName: 'plan.txt',
        score: 2,
        text: 'The member should complete onboarding before diagnostics.',
      },
    ];
    const retrievalService = {
      retrieve: jest.fn(async () => chunks),
    } as unknown as NotebookRetrievalService;
    const llmProvider = {
      generateAnswer: jest.fn(
        async () => 'Complete onboarding before diagnostics. [1]',
      ),
    } as unknown as LlmProviderService;
    const service = new NotebookAgentService(
      retrievalService,
      llmProvider,
      disabledKnowledgeBaseService(),
    );

    await expect(
      service.answerQuestion(
        'What should happen first?',
        'user-1',
        'notebook-1',
        ['document-1'],
      ),
    ).resolves.toEqual({
      answer: 'Complete onboarding before diagnostics. [1]',
      citations: [
        {
          chunkIndex: 0,
          documentId: 'document-1',
          documentName: 'plan.txt',
          snippet: 'The member should complete onboarding before diagnostics.',
        },
      ],
    });
    expect(retrievalService.retrieve).toHaveBeenCalledWith(
      'What should happen first?',
      'user-1',
      'notebook-1',
      ['document-1'],
    );
    expect(llmProvider.generateAnswer).toHaveBeenCalledWith({
      chunks,
      question: 'What should happen first?',
    });
  });

  it('uses Bedrock Knowledge Bases when KB retrieval is enabled', async () => {
    const retrievalService = {
      retrieve: jest.fn(),
    } as unknown as NotebookRetrievalService;
    const knowledgeBaseService = {
      answerQuestion: jest.fn(async () => ({
        answer: 'Knowledge base answer.',
        citations: [],
      })),
      isBedrockKnowledgeBaseEnabled: true,
    } as unknown as KnowledgeBaseService;
    const service = new NotebookAgentService(
      retrievalService,
      {} as unknown as LlmProviderService,
      knowledgeBaseService,
    );

    await expect(
      service.answerQuestion(
        'What should happen first?',
        'user-1',
        'notebook-1',
        ['document-1'],
      ),
    ).resolves.toEqual({
      answer: 'Knowledge base answer.',
      citations: [],
    });
    expect(retrievalService.retrieve).not.toHaveBeenCalled();
    expect(knowledgeBaseService.answerQuestion).toHaveBeenCalledWith({
      documentIds: ['document-1'],
      message: 'What should happen first?',
      notebookId: 'notebook-1',
      ownerUserId: 'user-1',
    });
  });
});

function disabledKnowledgeBaseService() {
  return {
    isBedrockKnowledgeBaseEnabled: false,
  } as unknown as KnowledgeBaseService;
}
