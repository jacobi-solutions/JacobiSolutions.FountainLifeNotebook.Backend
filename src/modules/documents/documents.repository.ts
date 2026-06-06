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

  findByIdForOwner(documentId: string, ownerUserId: string) {
    return this.model.findOne({ id: documentId, ownerUserId }).exec();
  }

  findByOwner(ownerUserId: string) {
    return this.model.find({ ownerUserId }).sort({ lastUpdatedDateUtc: -1 }).exec();
  }

  async deleteByIdForOwner(documentId: string, ownerUserId: string) {
    const result = await this.model.deleteOne({ id: documentId, ownerUserId }).exec();
    return result.deletedCount === 1;
  }
}
