import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type NotebookDocument = HydratedDocument<Notebook>;
export const NOTEBOOK_MEMBER_ROLES = [
  'owner',
  'clinician',
  'patient',
  'viewer',
] as const;
export type NotebookMemberRole = (typeof NOTEBOOK_MEMBER_ROLES)[number];
export const NOTEBOOK_MEMBER_STATUSES = ['active', 'invited'] as const;
export type NotebookMemberStatus = (typeof NOTEBOOK_MEMBER_STATUSES)[number];

@Schema({ _id: false, id: false })
export class NotebookMember {
  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  invitedByUserId?: string;

  @Prop({ enum: NOTEBOOK_MEMBER_ROLES, required: true, type: String })
  role!: NotebookMemberRole;

  @Prop({ default: () => new Date(), required: true })
  addedDateUtc!: Date;

  @Prop({
    enum: NOTEBOOK_MEMBER_STATUSES,
    default: 'active',
    required: true,
    type: String,
  })
  status!: NotebookMemberStatus;

  @Prop({ type: String })
  userId?: string;
}

export const NotebookMemberSchema =
  SchemaFactory.createForClass(NotebookMember);

@Schema({ collection: 'notebooks', id: false })
export class Notebook extends BaseModel {
  @Prop({ required: true })
  ownerUserId!: string;

  @Prop({ default: [], type: [NotebookMemberSchema] })
  members!: NotebookMember[];

  @Prop({ default: 'Member notebook', required: true })
  category!: string;

  @Prop({
    default:
      'A focused workspace for sources, questions, citations, and Zori insights.',
    required: true,
  })
  description!: string;

  @Prop({ default: 'Untitled notebook', required: true })
  title!: string;
}

export const NotebookSchema = SchemaFactory.createForClass(Notebook);
NotebookSchema.index({ ownerUserId: 1, lastUpdatedDateUtc: -1 });
NotebookSchema.index({ 'members.userId': 1, lastUpdatedDateUtc: -1 });
NotebookSchema.index({ 'members.email': 1, lastUpdatedDateUtc: -1 });
