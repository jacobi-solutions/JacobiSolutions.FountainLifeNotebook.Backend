import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import {
  Workspace,
  WorkspaceDocument,
  type WorkspaceMember,
  type WorkspaceMemberRole,
  type WorkspaceMemberStatus,
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

  async addOrUpdateMember(input: {
    email: string;
    invitedByUserId: string;
    role: WorkspaceMemberRole;
    status: WorkspaceMemberStatus;
    userId?: string;
    workspaceId: string;
  }) {
    const email = input.email.toLocaleLowerCase();
    const lastUpdatedDateUtc = new Date();
    const existingWorkspace = await this.model
      .findOneAndUpdate(
        {
          id: input.workspaceId,
          'members.email': email,
        },
        {
          $set: {
            'members.$.invitedByUserId': input.invitedByUserId,
            'members.$.role': input.role,
            'members.$.status': input.status,
            'members.$.userId': input.userId,
            lastUpdatedDateUtc,
          },
        },
        { returnDocument: 'after' },
      )
      .exec();

    if (existingWorkspace) {
      return existingWorkspace;
    }

    return this.model
      .findOneAndUpdate(
        {
          id: input.workspaceId,
          members: { $not: { $elemMatch: { email } } },
        },
        {
          $push: {
            members: {
              addedDateUtc: new Date(),
              email,
              invitedByUserId: input.invitedByUserId,
              role: input.role,
              status: input.status,
              userId: input.userId,
            },
          },
          $set: { lastUpdatedDateUtc },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }
}
