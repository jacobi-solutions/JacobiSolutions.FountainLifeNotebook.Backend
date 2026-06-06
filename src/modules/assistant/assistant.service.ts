import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AssistantConversationsRepository } from './assistant-conversations.repository';
import { AssistantConversationDto } from './dto/assistant-conversation.dto';
import { AssistantConversationMessageDto } from './dto/assistant-conversation-message.dto';
import { AssistantConversationParticipantDto } from './dto/assistant-conversation-participant.dto';
import type { SendAssistantMessagePayloadDto } from './dto/send-assistant-message.dto';
import {
  AssistantConversation,
  AssistantConversationDocument,
  AssistantConversationItem,
  AssistantConversationParticipant,
} from './schemas/assistant-conversation.schema';

export interface AssistantSummary {
  description: string;
  key: string;
  name: string;
}

export interface AssistantThreadUpdate {
  conversationId: string;
  messageId?: string;
  role: 'assistant' | 'system' | 'user';
  text: string;
  type: 'message' | 'status';
}

@Injectable()
export class AssistantService {
  constructor(private readonly conversationsRepository: AssistantConversationsRepository) {}

  listAssistants(): AssistantSummary[] {
    return [
      {
        description: 'Starter support assistant wired for streaming responses.',
        key: 'support',
        name: 'Support Assistant',
      },
    ];
  }

  async *streamMessage(
    assistantKey: string,
    request: SendAssistantMessagePayloadDto,
    user: AuthenticatedUser,
  ): AsyncGenerator<AssistantThreadUpdate> {
    const conversation = await this.loadOrCreateConversation(assistantKey, request, user);
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
      text: `${assistantKey} assistant received a message from ${user.username}.`,
      type: 'status',
    };

    const assistantMessage = this.createAssistantMessage(
      turnId,
      `Fountain Life Notebook is ready to replace this stub with a provider-backed runtime. You said: ${request.message}`,
    );

    conversation.items.push(assistantMessage);
    await this.conversationsRepository.saveConversation(conversation);

    yield {
      conversationId,
      messageId: assistantMessage.id,
      role: 'assistant',
      text: assistantMessage.text,
      type: 'message',
    };
  }

  async getConversation(conversationId: string, user: AuthenticatedUser): Promise<AssistantConversationDto> {
    const conversation = await this.conversationsRepository.findByIdForParticipant(conversationId, user.subject);
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
      const existing = await this.conversationsRepository.findById(request.conversationId);
      if (!existing) {
        throw new NotFoundException('Conversation was not found.');
      }

      if (!this.hasActiveParticipant(existing, user.subject)) {
        throw new ForbiddenException('User is not a participant in this conversation.');
      }

      return existing;
    }

    return this.conversationsRepository.create({
      assistantKey,
      items: [],
      metadata: {},
      participants: this.createParticipants(request.participantUserIds ?? [], user),
    });
  }

  private createParticipants(participantUserIds: string[], user: AuthenticatedUser): AssistantConversationParticipant[] {
    const participantIds = [user.subject, ...participantUserIds].filter(
      (value, index, values) => value.trim().length > 0 && values.indexOf(value) === index,
    );

    return participantIds.map((userId, index) => ({
      displayName: userId === user.subject ? user.username : undefined,
      joinedDateUtc: new Date(),
      role: index === 0 ? 'owner' : 'member',
      status: 'active',
      userId,
    }));
  }

  private hasActiveParticipant(conversation: AssistantConversation, userId: string) {
    return conversation.participants.some(
      (participant) => participant.userId === userId && participant.status === 'active',
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

  private createAssistantMessage(turnId: string, text: string): AssistantConversationItem {
    return {
      actorDisplayName: 'Fountain Life Notebook',
      actorType: 'assistant',
      createdDateUtc: new Date(),
      id: randomUUID(),
      role: 'assistant',
      text,
      turnId,
      visibility: 'user',
    };
  }

  private toDto(conversation: AssistantConversationDocument): AssistantConversationDto {
    return {
      assistantKey: conversation.assistantKey,
      createdDateUtc: conversation.createdDateUtc,
      id: conversation.id,
      lastUpdatedDateUtc: conversation.lastUpdatedDateUtc,
      messages: conversation.items
        .filter((item) => item.visibility === 'user')
        .map((item): AssistantConversationMessageDto => ({
          actorDisplayName: item.actorDisplayName,
          actorUserId: item.actorUserId,
          createdDateUtc: item.createdDateUtc,
          id: item.id,
          role: item.role,
          text: item.text,
        })),
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
}
