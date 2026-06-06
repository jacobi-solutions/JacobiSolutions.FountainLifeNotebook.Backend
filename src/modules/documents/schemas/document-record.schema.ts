import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';
import { DOCUMENT_PROCESSING_STATUSES } from '../document.constants';
import type { DocumentProcessingStatus } from '../document.constants';

export type DocumentRecordDocument = HydratedDocument<DocumentRecord>;

@Schema({ collection: 'documents', id: false })
export class DocumentRecord extends BaseModel {
  @Prop({ required: true })
  ownerUserId!: string;

  @Prop({ required: true })
  originalFileName!: string;

  @Prop({ required: true })
  contentType!: string;

  @Prop({ required: true })
  byteSize!: number;

  @Prop({ required: true })
  storageKey!: string;

  @Prop({
    default: 'ready',
    enum: DOCUMENT_PROCESSING_STATUSES,
    required: true,
    type: String,
  })
  status!: DocumentProcessingStatus;

  @Prop({ default: 0, required: true })
  chunkCount!: number;

  @Prop()
  textPreview?: string;
}

export const DocumentRecordSchema =
  SchemaFactory.createForClass(DocumentRecord);
DocumentRecordSchema.index({ ownerUserId: 1, lastUpdatedDateUtc: -1 });
