import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type WorkspaceDocument = HydratedDocument<Workspace>;
export const WORKSPACE_MEMBER_ROLES = [
  'owner',
  'clinician',
  'patient',
  'viewer',
] as const;
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];
export const WORKSPACE_MEMBER_STATUSES = ['active', 'invited'] as const;
export type WorkspaceMemberStatus = (typeof WORKSPACE_MEMBER_STATUSES)[number];

@Schema({ _id: false, id: false })
export class WorkspaceMember {
  @Prop({ type: String })
  email?: string;

  @Prop({ type: String })
  invitedByUserId?: string;

  @Prop({ enum: WORKSPACE_MEMBER_ROLES, required: true, type: String })
  role!: WorkspaceMemberRole;

  @Prop({ default: () => new Date(), required: true })
  addedDateUtc!: Date;

  @Prop({
    enum: WORKSPACE_MEMBER_STATUSES,
    default: 'active',
    required: true,
    type: String,
  })
  status!: WorkspaceMemberStatus;

  @Prop({ type: String })
  userId?: string;
}

export const WorkspaceMemberSchema =
  SchemaFactory.createForClass(WorkspaceMember);

@Schema({ collection: 'workspaces', id: false })
export class Workspace extends BaseModel {
  @Prop({ default: true, required: true })
  isDefault!: boolean;

  @Prop({ default: [], type: [WorkspaceMemberSchema] })
  members!: WorkspaceMember[];

  @Prop({ default: 'Member workspace', required: true })
  name!: string;

  @Prop({ required: true })
  ownerUserId!: string;
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
WorkspaceSchema.index(
  { ownerUserId: 1, isDefault: 1 },
  { partialFilterExpression: { isDefault: true }, unique: true },
);
WorkspaceSchema.index({ 'members.userId': 1, lastUpdatedDateUtc: -1 });
WorkspaceSchema.index({ 'members.email': 1, lastUpdatedDateUtc: -1 });
