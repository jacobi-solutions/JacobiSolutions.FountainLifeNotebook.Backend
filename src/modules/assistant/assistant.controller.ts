import { Body, Controller, HttpCode, HttpStatus, Logger, Param, Post, Res, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ResponseFactory } from '../../shared/contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssistantService } from './assistant.service';
import { AssistantThreadUpdateResponseDto } from './dto/assistant-thread-update-response.dto';
import { GetAssistantConversationRequestDto } from './dto/get-assistant-conversation.dto';
import { GetAssistantConversationResponseDto } from './dto/get-assistant-conversation-response.dto';
import { ListAssistantsRequestDto } from './dto/list-assistants.dto';
import { ListAssistantsResponseDto } from './dto/list-assistants-response.dto';
import { SendAssistantMessageDto } from './dto/send-assistant-message.dto';

@ApiBearerAuth()
@ApiTags('assistants')
@UseGuards(AuthenticatedUserGuard)
@Controller('assistants')
export class AssistantController {
  private readonly logger = new Logger(AssistantController.name);

  constructor(private readonly assistantService: AssistantService) {}

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListAssistantsResponseDto })
  listAssistants(
    @Body() _request: ListAssistantsRequestDto,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(this.assistantService.listAssistants(), correlationId);
  }

  @Post('conversation/get')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: GetAssistantConversationResponseDto })
  async getConversation(
    @Body() request: GetAssistantConversationRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.payload) {
      return ResponseFactory.failure(
        { errorCode: 'VALIDATION_ERROR', errorMessage: 'Request payload is required.' },
        correlationId,
      );
    }

    return ResponseFactory.success(
      await this.assistantService.getConversation(request.payload.conversationId, user),
      correlationId,
    );
  }

  @Post(':assistantKey/messages/stream')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({
    description: 'Server-sent event stream. Each data event is an AssistantThreadUpdateResponseDto.',
    type: AssistantThreadUpdateResponseDto,
  })
  async streamMessage(
    @Param('assistantKey') assistantKey: string,
    @Body() request: SendAssistantMessageDto,
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
            { errorCode: 'VALIDATION_ERROR', errorMessage: 'Request payload is required.' },
            correlationId,
          ),
        )}\n\n`,
      );
      response.end();
      return;
    }

    try {
      for await (const update of this.assistantService.streamMessage(assistantKey, request.payload, user)) {
        response.write(`data: ${JSON.stringify(ResponseFactory.success(update, correlationId))}\n\n`);
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
                  error instanceof Error ? error.message : 'The assistant stream failed unexpectedly.',
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
