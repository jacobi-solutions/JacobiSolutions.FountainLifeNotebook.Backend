import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
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
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLocaleLowerCase();
}
