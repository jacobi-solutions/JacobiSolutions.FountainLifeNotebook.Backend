import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseModel } from '../../../shared/models/base.model';

export type DocumentChunkDocument = HydratedDocument<DocumentChunk>;

@Schema({ collection: 'documentChunks', id: false })
export class DocumentChunk extends BaseModel {
  @Prop({ required: true })
  ownerUserId!: string;

  @Prop({ index: true, required: true })
  notebookId!: string;

  @Prop({ index: true, required: true })
  documentId!: string;

  @Prop({ required: true })
  documentName!: string;

  @Prop({ required: true })
  chunkIndex!: number;

  @Prop({ required: true })
  text!: string;
}

export const DocumentChunkSchema = SchemaFactory.createForClass(DocumentChunk);
DocumentChunkSchema.index({ ownerUserId: 1, documentId: 1, chunkIndex: 1 });
DocumentChunkSchema.index({ ownerUserId: 1, notebookId: 1, documentId: 1, chunkIndex: 1 });
