import { Injectable } from '@nestjs/common';
import {
  NOTEBOOK_ASSISTANT_DESCRIPTION,
  NOTEBOOK_ASSISTANT_KEY,
  NOTEBOOK_ASSISTANT_NAME,
} from './assistant.constants';
import {
  AssistantHandler,
  AssistantQuestionRequest,
} from './assistant-handler';
import { NotebookAgentService } from './notebook-agent.service';

@Injectable()
export class NotebookAssistantHandler implements AssistantHandler {
  readonly summary = {
    description: NOTEBOOK_ASSISTANT_DESCRIPTION,
    key: NOTEBOOK_ASSISTANT_KEY,
    name: NOTEBOOK_ASSISTANT_NAME,
  };

  constructor(private readonly notebookAgentService: NotebookAgentService) {}

  answerQuestion(request: AssistantQuestionRequest) {
    return this.notebookAgentService.answerQuestion(
      request.message,
      request.ownerUserId,
      request.documentIds,
    );
  }
}
