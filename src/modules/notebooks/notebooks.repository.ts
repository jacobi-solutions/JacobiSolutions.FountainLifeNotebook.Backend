import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseRepository } from '../../shared/repositories/base.repository';
import {
  Notebook,
  NotebookDocument,
  type NotebookMemberRole,
  type NotebookMemberStatus,
} from './schemas/notebook.schema';

@Injectable()
export class NotebooksRepository extends BaseRepository<
  Notebook,
  NotebookDocument
> {
  constructor(
    @InjectModel(Notebook.name)
    notebookModel: Model<NotebookDocument>,
  ) {
    super(notebookModel);
  }

  findByIdForMember(
    notebookId: string,
    user: { email: string | null; subject: string },
  ) {
    return this.model
      .findOne({
        id: notebookId,
        $or: membershipFilters(user),
      })
      .exec();
  }

  findByIdForOwner(notebookId: string, ownerUserId: string) {
    return this.model
      .findOne({
        id: notebookId,
        $or: [
          { ownerUserId },
          { members: { $elemMatch: { role: 'owner', userId: ownerUserId } } },
        ],
      })
      .exec();
  }

  findByMember(user: { email: string | null; subject: string }) {
    return this.model
      .find({ $or: membershipFilters(user) })
      .sort({ lastUpdatedDateUtc: -1 })
      .exec();
  }

  updateByIdForOwner(
    notebookId: string,
    ownerUserId: string,
    update: Partial<Pick<Notebook, 'category' | 'description' | 'title'>>,
  ) {
    return this.model
      .findOneAndUpdate(
        { id: notebookId, $or: ownerFilters(ownerUserId) },
        {
          $set: {
            ...update,
            lastUpdatedDateUtc: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .exec();
  }

  async deleteByIdForOwner(notebookId: string, ownerUserId: string) {
    const result = await this.model
      .deleteOne({
        id: notebookId,
        $or: [
          { ownerUserId },
          { members: { $elemMatch: { role: 'owner', userId: ownerUserId } } },
        ],
      })
      .exec();
    return result.deletedCount === 1;
  }

  addOrUpdateMember(input: {
    email: string;
    invitedByUserId: string;
    notebookId: string;
    role: NotebookMemberRole;
    status: NotebookMemberStatus;
    userId?: string;
  }) {
    const email = input.email.toLocaleLowerCase();

    return this.model
      .findOneAndUpdate(
        {
          id: input.notebookId,
          'members.email': email,
          $or: ownerFilters(input.invitedByUserId),
        },
        {
          $set: {
            'members.$.invitedByUserId': input.invitedByUserId,
            'members.$.role': input.role,
            'members.$.status': input.status,
            'members.$.userId': input.userId,
            lastUpdatedDateUtc: new Date(),
          },
        },
        { returnDocument: 'after' },
      )
      .exec()
      .then((notebook) =>
        notebook
          ? notebook
          : this.model
              .findOneAndUpdate(
                {
                  id: input.notebookId,
                  $or: ownerFilters(input.invitedByUserId),
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
                  $set: { lastUpdatedDateUtc: new Date() },
                },
                { returnDocument: 'after' },
              )
              .exec(),
      );
  }

  async addOrUpdateMemberForWorkspace(input: {
    email: string;
    invitedByUserId: string;
    notebookId: string;
    role: NotebookMemberRole;
    status: NotebookMemberStatus;
    userId?: string;
    workspaceId: string;
  }) {
    const email = input.email.toLocaleLowerCase();
    const lastUpdatedDateUtc = new Date();

    const existingNotebook = await this.model
      .findOneAndUpdate(
        {
          id: input.notebookId,
          workspaceId: input.workspaceId,
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

    if (existingNotebook) {
      return existingNotebook;
    }

    return this.model
      .findOneAndUpdate(
        {
          id: input.notebookId,
          workspaceId: input.workspaceId,
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

function membershipFilters(user: { email: string | null; subject: string }) {
  const filters: Record<string, unknown>[] = [
    { ownerUserId: user.subject },
    { members: { $elemMatch: { userId: user.subject } } },
  ];
  if (user.email) {
    filters.push({
      members: {
        $elemMatch: { email: user.email.toLocaleLowerCase() },
      },
    });
  }

  return filters;
}

function ownerFilters(ownerUserId: string) {
  return [
    { ownerUserId },
    { members: { $elemMatch: { role: 'owner', userId: ownerUserId } } },
  ];
}
