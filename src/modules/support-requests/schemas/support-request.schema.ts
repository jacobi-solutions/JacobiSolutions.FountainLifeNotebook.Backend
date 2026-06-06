import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type SupportRequestDocument = HydratedDocument<SupportRequest>;
export type SupportRequestPriority = 'high' | 'low' | 'normal';
export type SupportRequestStatus = 'open' | 'resolved';

@Schema({ collection: 'supportRequests', id: false })
export class SupportRequest extends BaseModel {
  @Prop({ required: true })
  createdByUserId!: string;

  @Prop({ required: true })
  subject!: string;

  @Prop({ required: true })
  description!: string;

  @Prop({ default: 'general', required: true })
  category!: string;

  @Prop({ default: 'normal', enum: ['high', 'low', 'normal'], required: true })
  priority!: SupportRequestPriority;

  @Prop({ default: 'open', enum: ['open', 'resolved'], required: true })
  status!: SupportRequestStatus;
}

export const SupportRequestSchema = SchemaFactory.createForClass(SupportRequest);
SupportRequestSchema.index({ createdByUserId: 1, lastUpdatedDateUtc: -1 });
