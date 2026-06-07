import { Injectable } from '@nestjs/common';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';
import { Citation } from '../data-contracts/citation';
import { LlmProviderService } from './llm-provider.service';
import { NotebookRetrievalService } from './notebook-retrieval.service';

export interface NotebookAgentAnswer {
  answer: string;
  citations: Citation[];
}

@Injectable()
export class NotebookAgentService {
  constructor(
    private readonly retrievalService: NotebookRetrievalService,
    private readonly llmProvider: LlmProviderService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  async answerQuestion(
    question: string,
    ownerUserId: string,
    notebookId: string,
    documentIds?: string[],
  ): Promise<NotebookAgentAnswer> {
    if (this.knowledgeBaseService.isBedrockKnowledgeBaseEnabled) {
      return this.knowledgeBaseService.answerQuestion({
        documentIds,
        message: question,
        notebookId,
        ownerUserId,
      });
    }

    const chunks = await this.retrievalService.retrieve(
      question,
      ownerUserId,
      notebookId,
      documentIds,
    );
    if (chunks.length === 0) {
      return {
        answer:
          'I could not find relevant content in the uploaded documents for that question. Try uploading another document or asking about details that appear in the current library.',
        citations: [],
      };
    }

    return {
      answer: await this.llmProvider.generateAnswer({ chunks, question }),
      citations: chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        snippet: createCitationSnippet(chunk.text),
      })),
    };
  }
}

function createCitationSnippet(text: string) {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  return singleLine.length <= 240 ? singleLine : `${singleLine.slice(0, 237)}...`;
}
