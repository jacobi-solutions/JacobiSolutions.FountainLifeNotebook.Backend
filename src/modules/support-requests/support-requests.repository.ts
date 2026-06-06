import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { SupportRequest, SupportRequestDocument } from './schemas/support-request.schema';

@Injectable()
export class SupportRequestsRepository extends BaseRepository<SupportRequest, SupportRequestDocument> {
  constructor(@InjectModel(SupportRequest.name) supportRequestModel: Model<SupportRequestDocument>) {
    super(supportRequestModel);
  }
}
