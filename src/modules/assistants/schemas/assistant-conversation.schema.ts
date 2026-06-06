import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { randomUUID } from 'crypto';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type AssistantConversationDocument = HydratedDocument<AssistantConversation>;
export type AssistantConversationItemRole = 'assistant' | 'system' | 'tool' | 'user';
export type AssistantConversationItemVisibility = 'internal' | 'user';
export type AssistantConversationParticipantRole = 'member' | 'owner';
export type AssistantConversationParticipantStatus = 'active' | 'removed';

@Schema({ _id: false })
export class AssistantConversationParticipant {
  @Prop({ required: true })
  userId!: string;

  @Prop()
  displayName?: string;

  @Prop({ default: 'member', enum: ['member', 'owner'], required: true })
  role!: AssistantConversationParticipantRole;

  @Prop({ default: 'active', enum: ['active', 'removed'], required: true })
  status!: AssistantConversationParticipantStatus;

  @Prop({ default: () => new Date(), required: true })
  joinedDateUtc!: Date;
}

export const AssistantConversationParticipantSchema = SchemaFactory.createForClass(
  AssistantConversationParticipant,
);

@Schema({ _id: false })
export class AssistantConversationItem {
  @Prop({ default: () => randomUUID(), required: true })
  id!: string;

  @Prop({ required: true })
  turnId!: string;

  @Prop({ enum: ['assistant', 'system', 'tool', 'user'], required: true })
  role!: AssistantConversationItemRole;

  @Prop({ default: 'user', enum: ['internal', 'user'], required: true })
  visibility!: AssistantConversationItemVisibility;

  @Prop({ default: '', required: true })
  text!: string;

  @Prop({ type: Object })
  structuredPayload?: Record<string, unknown>;

  @Prop()
  toolName?: string;

  @Prop()
  toolCallId?: string;

  @Prop({ required: true })
  actorType!: string;

  @Prop()
  actorUserId?: string;

  @Prop()
  actorDisplayName?: string;

  @Prop({ default: () => new Date(), required: true })
  createdDateUtc!: Date;
}

export const AssistantConversationItemSchema = SchemaFactory.createForClass(AssistantConversationItem);

@Schema({ collection: 'assistantConversations', id: false })
export class AssistantConversation extends BaseModel {
  @Prop({ index: true, required: true })
  assistantKey!: string;

  @Prop({ default: {}, type: Object })
  metadata!: Record<string, unknown>;

  @Prop({ default: [], type: [AssistantConversationParticipantSchema] })
  participants!: AssistantConversationParticipant[];

  @Prop({ default: [], type: [AssistantConversationItemSchema] })
  items!: AssistantConversationItem[];
}

export const AssistantConversationSchema = SchemaFactory.createForClass(AssistantConversation);
AssistantConversationSchema.index({ 'participants.userId': 1, lastUpdatedDateUtc: -1 });
AssistantConversationSchema.index({ assistantKey: 1, lastUpdatedDateUtc: -1 });
