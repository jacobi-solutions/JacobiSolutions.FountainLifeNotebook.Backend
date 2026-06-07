import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import {
  DocumentChunk,
  DocumentChunkDocument,
} from './schemas/document-chunk.schema';

@Injectable()
export class DocumentChunksRepository extends BaseRepository<
  DocumentChunk,
  DocumentChunkDocument
> {
  constructor(
    @InjectModel(DocumentChunk.name)
    chunkModel: Model<DocumentChunkDocument>,
  ) {
    super(chunkModel);
  }

  createMany(chunks: Partial<DocumentChunk>[]) {
    return this.model.insertMany(chunks);
  }

  findByNotebookAndDocumentIds(notebookId: string, documentIds?: string[]) {
    return this.model
      .find({
        notebookId,
        ...(documentIds && documentIds.length > 0
          ? { documentId: { $in: documentIds } }
          : {}),
      })
      .sort({ documentId: 1, chunkIndex: 1 })
      .exec();
  }

  findByNotebookAndDocumentId(notebookId: string, documentId: string) {
    return this.model
      .find({ documentId, notebookId })
      .sort({ chunkIndex: 1 })
      .exec();
  }

  async deleteByDocumentIdForNotebook(documentId: string, notebookId: string) {
    await this.model.deleteMany({ documentId, notebookId }).exec();
  }
}
