import { Citation } from './data-contracts/citation';

export interface AssistantSummary {
  description: string;
  key: string;
  name: string;
}

export interface AssistantAnswer {
  answer: string;
  citations: Citation[];
}

export interface AssistantQuestionRequest {
  documentIds?: string[];
  message: string;
  notebookId: string;
  ownerUserId: string;
}

export interface AssistantHandler {
  readonly summary: AssistantSummary;
  answerQuestion(request: AssistantQuestionRequest): Promise<AssistantAnswer>;
}

export const ASSISTANT_HANDLERS = Symbol('ASSISTANT_HANDLERS');
