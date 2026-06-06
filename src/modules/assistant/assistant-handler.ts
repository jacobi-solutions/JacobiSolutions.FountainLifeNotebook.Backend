import { CitationDto } from './dto/citation.dto';

export interface AssistantSummary {
  description: string;
  key: string;
  name: string;
}

export interface AssistantAnswer {
  answer: string;
  citations: CitationDto[];
}

export interface AssistantQuestionRequest {
  documentIds?: string[];
  message: string;
  ownerUserId: string;
}

export interface AssistantHandler {
  readonly summary: AssistantSummary;
  answerQuestion(request: AssistantQuestionRequest): Promise<AssistantAnswer>;
}

export const ASSISTANT_HANDLERS = Symbol('ASSISTANT_HANDLERS');
