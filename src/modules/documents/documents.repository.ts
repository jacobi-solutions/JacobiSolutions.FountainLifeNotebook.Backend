import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { DocumentRecord, DocumentRecordDocument } from './schemas/document-record.schema';

@Injectable()
export class DocumentsRepository extends BaseRepository<DocumentRecord, DocumentRecordDocument> {
  constructor(
    @InjectModel(DocumentRecord.name)
    documentModel: Model<DocumentRecordDocument>,
  ) {
    super(documentModel);
  }

  findByIdForNotebook(documentId: string, notebookId: string) {
    return this.model.findOne({ id: documentId, notebookId }).exec();
  }

  findByNotebook(notebookId: string) {
    return this.model
      .find({ notebookId })
      .sort({ lastUpdatedDateUtc: -1 })
      .exec();
  }

  findByNotebookIds(notebookIds: string[]) {
    return this.model
      .aggregate<{ _id: string; count: number }>([
        {
          $match: {
            notebookId: { $in: notebookIds },
          },
        },
        {
          $group: {
            _id: '$notebookId',
            count: { $sum: 1 },
          },
        },
      ])
      .exec();
  }

  async deleteByIdForNotebook(documentId: string, notebookId: string) {
    const result = await this.model.deleteOne({ id: documentId, notebookId }).exec();
    return result.deletedCount === 1;
  }
}
