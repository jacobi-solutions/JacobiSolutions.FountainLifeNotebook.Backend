import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import { Account, AccountDocument } from './schemas/account.schema';

@Injectable()
export class AccountsRepository extends BaseRepository<Account, AccountDocument> {
  constructor(@InjectModel(Account.name) accountModel: Model<AccountDocument>) {
    super(accountModel);
  }

  async findBySubject(cognitoSubject: string) {
    return this.model.findOne({ cognitoSubject }).exec();
  }

  async upsertAccount(input: { cognitoSubject: string; email: string; username: string }) {
    return this.model
      .findOneAndUpdate(
        { cognitoSubject: input.cognitoSubject },
        {
          $set: {
            ...input,
            lastUpdatedDateUtc: new Date(),
          },
          $setOnInsert: {
            createdDateUtc: new Date(),
          },
        },
        { new: true, upsert: true },
      )
      .exec();
  }
}
