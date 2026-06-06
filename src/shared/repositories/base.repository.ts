import { Model, UpdateQuery } from 'mongoose';
import { BaseModel } from '../models/base.model';

export abstract class BaseRepository<TModel extends BaseModel, TDocument extends TModel> {
  protected constructor(protected readonly model: Model<TDocument>) {}

  findById(id: string) {
    return this.model.findOne({ id } as Record<string, unknown>).exec();
  }

  create(input: Partial<TModel>) {
    return this.model.create(input as Partial<TDocument>);
  }

  updateById(id: string, update: UpdateQuery<TDocument>) {
    return this.model
      .findOneAndUpdate(
        { id } as Record<string, unknown>,
        {
          ...update,
          $set: {
            ...(typeof update.$set === 'object' ? update.$set : {}),
            lastUpdatedDateUtc: new Date(),
          },
        },
        { new: true },
      )
      .exec();
  }
}
