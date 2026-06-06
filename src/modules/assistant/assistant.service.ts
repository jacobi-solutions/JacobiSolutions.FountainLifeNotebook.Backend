import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssistantConversationsRepository } from './assistant-conversations.repository';
import {
  ASSISTANT_SEARCH_STATUS_TEXT,
  NOTEBOOK_ASSISTANT_DISPLAY_NAME,
} from './assistant.constants';
import { AssistantSummary } from './assistant-handler';
import { AssistantRegistry } from './assistant-registry';
import { AssistantConversationDto } from './dto/assistant-conversation.dto';
import { AssistantConversationMessageDto } from './dto/assistant-conversation-message.dto';
import { AssistantConversationParticipantDto } from './dto/assistant-conversation-participant.dto';
import { CitationDto } from './dto/citation.dto';
import type { SendAssistantMessagePayloadDto } from './dto/send-assistant-message.dto';
import {
  AssistantConversation,
  AssistantConversationDocument,
  AssistantConversationItem,
  AssistantConversationParticipant,
} from './schemas/assistant-conversation.schema';

export interface AssistantThreadUpdate {
  citations?: CitationDto[];
  conversationId: string;
  messageId?: string;
  role: 'assistant' | 'system' | 'user';
  text: string;
  type: 'message' | 'status';
}

@Injectable()
export class AssistantService {
  constructor(
    private readonly conversationsRepository: AssistantConversationsRepository,
    private readonly assistantRegistry: AssistantRegistry,
  ) {}

  listAssistants(): AssistantSummary[] {
    return this.assistantRegistry.listSummaries();
  }

  async *streamMessage(
    assistantKey: string,
    request: SendAssistantMessagePayloadDto,
    user: AuthenticatedUser,
  ): AsyncGenerator<AssistantThreadUpdate> {
    const handler = this.assistantRegistry.getOrThrow(assistantKey);
    const conversation = await this.loadOrCreateConversation(
      assistantKey,
      request,
      user,
    );
    const conversationId = conversation.id;
    const turnId = randomUUID();
    const userMessage = this.createUserMessage(turnId, request.message, user);

    conversation.items.push(userMessage);
    await this.conversationsRepository.saveConversation(conversation);

    yield {
      conversationId,
      messageId: userMessage.id,
      role: 'user',
      text: request.message,
      type: 'message',
    };

    yield {
      conversationId,
      role: 'system',
      text: ASSISTANT_SEARCH_STATUS_TEXT,
      type: 'status',
    };

    const answer = await handler.answerQuestion({
      documentIds: request.documentIds,
      message: request.message,
      ownerUserId: user.subject,
    });
    const assistantMessage = this.createAssistantMessage(
      turnId,
      answer.answer,
      answer.citations,
    );

    conversation.items.push(assistantMessage);
    await this.conversationsRepository.saveConversation(conversation);

    yield {
      conversationId,
      messageId: assistantMessage.id,
      role: 'assistant',
      citations: answer.citations,
      text: assistantMessage.text,
      type: 'message',
    };
  }

  async getConversation(
    conversationId: string,
    user: AuthenticatedUser,
  ): Promise<AssistantConversationDto> {
    const conversation =
      await this.conversationsRepository.findByIdForParticipant(
        conversationId,
        user.subject,
      );
    if (!conversation) {
      throw new NotFoundException('Conversation was not found.');
    }

    return this.toDto(conversation);
  }

  private async loadOrCreateConversation(
    assistantKey: string,
    request: SendAssistantMessagePayloadDto,
    user: AuthenticatedUser,
  ) {
    if (request.conversationId) {
      const existing = await this.conversationsRepository.findById(
        request.conversationId,
      );
      if (!existing) {
        throw new NotFoundException('Conversation was not found.');
      }

      if (!this.hasActiveParticipant(existing, user.subject)) {
        throw new ForbiddenException(
          'User is not a participant in this conversation.',
        );
      }

      if (existing.assistantKey !== assistantKey) {
        throw new BadRequestException(
          'Conversation belongs to a different assistant.',
        );
      }

      return existing;
    }

    return this.conversationsRepository.create({
      assistantKey,
      items: [],
      metadata: {},
      participants: this.createParticipants(
        request.participantUserIds ?? [],
        user,
      ),
    });
  }

  private createParticipants(
    participantUserIds: string[],
    user: AuthenticatedUser,
  ): AssistantConversationParticipant[] {
    const participantIds = [user.subject, ...participantUserIds].filter(
      (value, index, values) =>
        value.trim().length > 0 && values.indexOf(value) === index,
    );

    return participantIds.map((userId, index) => ({
      displayName: userId === user.subject ? user.username : undefined,
      joinedDateUtc: new Date(),
      role: index === 0 ? 'owner' : 'member',
      status: 'active',
      userId,
    }));
  }

  private hasActiveParticipant(
    conversation: AssistantConversation,
    userId: string,
  ) {
    return conversation.participants.some(
      (participant) =>
        participant.userId === userId && participant.status === 'active',
    );
  }

  private createUserMessage(
    turnId: string,
    message: string,
    user: AuthenticatedUser,
  ): AssistantConversationItem {
    return {
      actorDisplayName: user.username,
      actorType: 'user',
      actorUserId: user.subject,
      createdDateUtc: new Date(),
      id: randomUUID(),
      role: 'user',
      text: message,
      turnId,
      visibility: 'user',
    };
  }

  private createAssistantMessage(
    turnId: string,
    text: string,
    citations: CitationDto[],
  ): AssistantConversationItem {
    return {
      actorDisplayName: NOTEBOOK_ASSISTANT_DISPLAY_NAME,
      actorType: 'assistant',
      createdDateUtc: new Date(),
      id: randomUUID(),
      role: 'assistant',
      structuredPayload: citations.length > 0 ? { citations } : undefined,
      text,
      turnId,
      visibility: 'user',
    };
  }

  private toDto(
    conversation: AssistantConversationDocument,
  ): AssistantConversationDto {
    return {
      assistantKey: conversation.assistantKey,
      createdDateUtc: conversation.createdDateUtc,
      id: conversation.id,
      lastUpdatedDateUtc: conversation.lastUpdatedDateUtc,
      messages: conversation.items
        .filter((item) => item.visibility === 'user')
        .map(
          (item): AssistantConversationMessageDto => ({
            actorDisplayName: item.actorDisplayName,
            actorUserId: item.actorUserId,
            citations: this.getMessageCitations(item.structuredPayload),
            createdDateUtc: item.createdDateUtc,
            id: item.id,
            role: item.role,
            text: item.text,
          }),
        ),
      participants: conversation.participants.map(
        (participant): AssistantConversationParticipantDto => ({
          displayName: participant.displayName,
          joinedDateUtc: participant.joinedDateUtc,
          role: participant.role,
          status: participant.status,
          userId: participant.userId,
        }),
      ),
    };
  }

  private getMessageCitations(payload?: Record<string, unknown>) {
    const citations = payload?.citations;
    if (!Array.isArray(citations)) {
      return undefined;
    }

    const normalized = citations.filter(isCitation).map(
      (citation): CitationDto => ({
        chunkIndex: citation.chunkIndex,
        documentId: citation.documentId,
        documentName: citation.documentName,
        snippet: citation.snippet,
      }),
    );

    return normalized.length > 0 ? normalized : undefined;
  }
}

function isCitation(value: unknown): value is CitationDto {
  return (
    typeof value === 'object' &&
    value !== null &&
    'chunkIndex' in value &&
    typeof value.chunkIndex === 'number' &&
    'documentId' in value &&
    typeof value.documentId === 'string' &&
    'documentName' in value &&
    typeof value.documentName === 'string' &&
    'snippet' in value &&
    typeof value.snippet === 'string'
  );
}
