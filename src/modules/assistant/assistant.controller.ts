import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResponseFactory } from '../../shared/data-contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssistantService } from './assistant.service';
import { AssistantThreadUpdateResponse } from './data-contracts/assistant-thread-update-response';
import { GetAssistantConversationRequest } from './data-contracts/get-assistant-conversation';
import { GetAssistantConversationResponse } from './data-contracts/get-assistant-conversation-response';
import { ListAssistantsRequest } from './data-contracts/list-assistants';
import { ListAssistantsResponse } from './data-contracts/list-assistants-response';
import { SendAssistantMessageRequest } from './data-contracts/send-assistant-message';

@ApiBearerAuth()
@ApiTags('assistants')
@UseGuards(AuthenticatedUserGuard)
@Controller('assistants')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  @Post('list-assistants')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListAssistantsResponse })
  listAssistants(
    @Body() _request: ListAssistantsRequest,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      this.assistantService.listAssistants(),
      correlationId,
    );
  }

  @Post('get-conversation')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: GetAssistantConversationResponse })
  async getConversation(
    @Body() request: GetAssistantConversationRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.payload) {
      return ResponseFactory.failure(
        {
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Request payload is required.',
        },
        correlationId,
      );
    }

    return ResponseFactory.success(
      await this.assistantService.getConversation(
        request.payload.conversationId,
        user,
      ),
      correlationId,
    );
  }

  @Post(':assistantKey/stream-message')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description:
      'Server-sent event stream. Each data event is an AssistantThreadUpdateResponse.',
    type: AssistantThreadUpdateResponse,
  })
  async streamAssistantMessage(
    @Param('assistantKey') assistantKey: string,
    @Body() request: SendAssistantMessageRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
    @Res() response: Response,
  ) {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.flushHeaders();

    if (!request.payload) {
      response.write(
        `data: ${JSON.stringify(
          ResponseFactory.failure(
            {
              errorCode: 'VALIDATION_ERROR',
              errorMessage: 'Request payload is required.',
            },
            correlationId,
          ),
        )}\n\n`,
      );
      response.end();
      return;
    }

    try {
      for await (const update of this.assistantService.streamMessage(
        assistantKey,
        request.payload,
        user,
      )) {
        response.write(
          `data: ${JSON.stringify(ResponseFactory.success(update, correlationId))}\n\n`,
        );
      }
    } catch (error) {
      this.logger.error({
        assistantKey,
        correlationId,
        error: error instanceof Error ? error.message : String(error),
        event: 'assistant.stream_failed',
        userId: user.subject,
      });

      if (!response.writableEnded) {
        response.write(
          `data: ${JSON.stringify(
            ResponseFactory.failure(
              {
                errorCode: 'ASSISTANT_STREAM_ERROR',
                errorMessage:
                  error instanceof Error
                    ? error.message
                    : 'The assistant stream failed unexpectedly.',
              },
              correlationId,
            ),
          )}\n\n`,
        );
      }
    } finally {
      response.end();
    }
  }
}
