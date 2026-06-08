import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import type {
  Notebook,
  NotebookDocument,
} from '../notebooks/schemas/notebook.schema';
import { WorkspacesRepository } from './workspaces.repository';
import type { WorkspaceMember } from './schemas/workspace.schema';

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

  ensureDefaultWorkspaceForNotebook(notebook: Notebook | NotebookDocument) {
    return this.workspacesRepository.ensureDefaultWorkspace({
      members: normalizeWorkspaceMembers(notebook),
      name: 'Member workspace',
      ownerUserId: notebook.ownerUserId,
    });
  }
}

function normalizeWorkspaceMembers(
  notebook: Notebook | NotebookDocument,
): WorkspaceMember[] {
  const members = (notebook.members ?? []).map((member) => ({
    addedDateUtc: member.addedDateUtc ?? new Date(),
    email: normalizeEmail(member.email),
    invitedByUserId: member.invitedByUserId,
    role: member.role,
    status: member.status,
    userId: member.userId,
  }));

  if (members.some((member) => member.role === 'owner')) {
    return members;
  }

  return [
    {
      addedDateUtc: new Date(),
      role: 'owner',
      status: 'active',
      userId: notebook.ownerUserId,
    },
    ...members,
  ];
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLocaleLowerCase();
}
