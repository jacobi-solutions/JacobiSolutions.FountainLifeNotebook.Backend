import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import {
  Workspace,
  WorkspaceDocument,
  type WorkspaceMember,
} from './schemas/workspace.schema';

@Injectable()
export class WorkspacesRepository extends BaseRepository<
  Workspace,
  WorkspaceDocument
> {
  constructor(
    @InjectModel(Workspace.name)
    workspaceModel: Model<WorkspaceDocument>,
  ) {
    super(workspaceModel);
  }

  async ensureDefaultWorkspace(input: {
    members: WorkspaceMember[];
    name: string;
    ownerUserId: string;
  }) {
    const workspace = await this.model
      .findOneAndUpdate(
        { isDefault: true, ownerUserId: input.ownerUserId },
        {
          $set: {
            lastUpdatedDateUtc: new Date(),
          },
          $setOnInsert: {
            createdDateUtc: new Date(),
            isDefault: true,
            members: input.members,
            name: input.name,
            ownerUserId: input.ownerUserId,
          },
        },
        { new: true, setDefaultsOnInsert: true, upsert: true },
      )
      .exec();

    if (!workspace) {
      throw new InternalServerErrorException(
        'Unable to create or load default workspace.',
      );
    }

    return workspace;
  }
}
