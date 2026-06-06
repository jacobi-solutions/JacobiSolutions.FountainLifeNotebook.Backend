import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import {
  AssistantConversation,
  AssistantConversationDocument,
} from './schemas/assistant-conversation.schema';

@Injectable()
export class AssistantConversationsRepository extends BaseRepository<
  AssistantConversation,
  AssistantConversationDocument
> {
  constructor(
    @InjectModel(AssistantConversation.name)
    conversationModel: Model<AssistantConversationDocument>,
  ) {
    super(conversationModel);
  }

  async findByIdForParticipant(conversationId: string, userId: string) {
    return this.model
      .findOne({
        id: conversationId,
        participants: {
          $elemMatch: {
            status: 'active',
            userId,
          },
        },
      })
      .exec();
  }

  async saveConversation(conversation: AssistantConversationDocument) {
    conversation.lastUpdatedDateUtc = new Date();
    return conversation.save();
  }
}
