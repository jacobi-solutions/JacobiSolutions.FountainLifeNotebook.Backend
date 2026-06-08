import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import type {
  WorkspaceMemberRole,
  WorkspaceMemberStatus,
} from './schemas/workspace.schema';
import { WorkspacesRepository } from './workspaces.repository';

@Injectable()
export class WorkspacesService {
  constructor(private readonly workspacesRepository: WorkspacesRepository) {}

  ensureDefaultWorkspaceForUser(user: AuthenticatedUser) {
    return this.workspacesRepository.ensureDefaultWorkspace({
      members: [
        {
          addedDateUtc: new Date(),
          email: normalizeEmail(user.email),
          role: 'owner',
          status: 'active',
          userId: user.subject,
        },
      ],
      name: 'Member workspace',
      ownerUserId: user.subject,
    });
  }

  findWorkspaceForMember(workspaceId: string, user: AuthenticatedUser) {
    return this.workspacesRepository.findByIdForMember(workspaceId, user);
  }

  listWorkspacesForMember(user: AuthenticatedUser) {
    return this.workspacesRepository.findByMember(user);
  }

  addOrUpdateWorkspaceMember(input: {
    email: string;
    invitedByUserId: string;
    role: WorkspaceMemberRole;
    status: WorkspaceMemberStatus;
    userId?: string;
    workspaceId: string;
  }) {
    return this.workspacesRepository.addOrUpdateMember({
      ...input,
      email: normalizeEmail(input.email),
    });
  }
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLocaleLowerCase();
}
