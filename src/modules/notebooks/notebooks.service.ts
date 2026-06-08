import {
  ForbiddenException,
  Inject,
  forwardRef,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DocumentsService } from '../documents/documents.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import {
  Workspace,
  WorkspaceDocument,
  WorkspaceMember,
} from '../workspaces/schemas/workspace.schema';
import { CreateNotebookRequest } from './data-contracts/create-notebook-request';
import { InviteNotebookMemberRequest } from './data-contracts/invite-notebook-member-request';
import { NotebookSummary } from './data-contracts/notebook-summary';
import { UpdateNotebookRequest } from './data-contracts/update-notebook-request';
import {
  NotebookInvitationService,
  type NotebookInviteDelivery,
} from './notebook-invitation.service';
import { NotebooksRepository } from './notebooks.repository';
import {
  Notebook,
  NotebookDocument,
  NotebookMember,
  type NotebookMemberRole,
} from './schemas/notebook.schema';

const DEFAULT_CATEGORY = 'Member notebook';
const DEFAULT_DESCRIPTION =
  'A focused workspace for sources, questions, citations, and Zori insights.';
const DEFAULT_TITLE = 'Untitled notebook';

@Injectable()
export class NotebooksService {
  constructor(
    private readonly notebooksRepository: NotebooksRepository,
    private readonly invitationService: NotebookInvitationService,
    private readonly workspacesService: WorkspacesService,
    @Inject(forwardRef(() => DocumentsService))
    private readonly documentsService: DocumentsService,
  ) {}

  async listNotebooks(user: AuthenticatedUser): Promise<NotebookSummary[]> {
    const workspaces =
      await this.workspacesService.listWorkspacesForMember(user);
    const workspaceById = new Map(
      workspaces.map((workspace) => [workspace.id, workspace]),
    );
    const notebooks = await this.notebooksRepository.findByWorkspaceOrMember(
      workspaces.map((workspace) => workspace.id),
      user,
    );
    const counts = await this.documentsService.countDocumentsByNotebook(
      user.subject,
      notebooks.map((notebook) => notebook.id),
    );

    return notebooks.map((notebook) =>
      this.toSummary(
        notebook,
        counts[notebook.id] ?? 0,
        user,
        workspaceById.get(notebook.workspaceId),
      ),
    );
  }

  async createNotebook(
    request: CreateNotebookRequest,
    user: AuthenticatedUser,
  ): Promise<NotebookSummary> {
    const workspace =
      await this.workspacesService.ensureDefaultWorkspaceForUser(user);
    const notebook = await this.notebooksRepository.create({
      category: cleanValue(request.category, DEFAULT_CATEGORY),
      description: cleanValue(request.description, DEFAULT_DESCRIPTION),
      members: [
        {
          addedDateUtc: new Date(),
          email: normalizeEmail(user.email),
          role: 'owner',
          status: 'active',
          userId: user.subject,
        },
      ],
      ownerUserId: user.subject,
      title: cleanValue(request.title, DEFAULT_TITLE),
      workspaceId: workspace.id,
    });

    return this.toSummary(notebook, 0, user, workspace);
  }

  async updateNotebook(
    request: UpdateNotebookRequest,
    user: AuthenticatedUser,
  ): Promise<NotebookSummary> {
    const access = await this.assertNotebookRole(request.notebookId, user, [
      'owner',
    ]);
    const notebook = await this.notebooksRepository.updateById(
      request.notebookId,
      {
        $set: {
          ...(request.category !== undefined
            ? { category: cleanValue(request.category, DEFAULT_CATEGORY) }
            : {}),
          ...(request.description !== undefined
            ? {
                description: cleanValue(
                  request.description,
                  DEFAULT_DESCRIPTION,
                ),
              }
            : {}),
          ...(request.title !== undefined
            ? { title: cleanValue(request.title, DEFAULT_TITLE) }
            : {}),
        },
      },
    );
    if (!notebook) {
      throw new NotFoundException('Notebook was not found.');
    }

    const counts = await this.documentsService.countDocumentsByNotebook(
      user.subject,
      [request.notebookId],
    );

    return this.toSummary(
      notebook,
      counts[request.notebookId] ?? 0,
      user,
      access.workspace,
    );
  }

  async deleteNotebook(notebookId: string, user: AuthenticatedUser) {
    await this.assertNotebookRole(notebookId, user, ['owner']);
    await this.documentsService.deleteNotebookDocuments(notebookId, user);
    await this.notebooksRepository.deleteById(notebookId);
  }

  async inviteNotebookMember(
    request: InviteNotebookMemberRequest,
    user: AuthenticatedUser,
  ): Promise<{
    inviteDelivery: NotebookInviteDelivery;
    notebook: NotebookSummary;
  }> {
    const selectedNotebook = await this.assertNotebookRole(
      request.notebookId,
      user,
      ['owner'],
    );
    if (request.role === 'owner') {
      throw new BadRequestException('Invited users must use a non-owner role.');
    }

    const email = normalizeEmail(request.email);
    if (email && email === normalizeEmail(user.email)) {
      throw new BadRequestException('Invite a different email address.');
    }

    const inviteResult = await this.invitationService.inviteUserByEmail(email);
    const memberInput = {
      email,
      invitedByUserId: user.subject,
      role: request.role,
      status: inviteResult.delivery === 'local' ? 'active' : 'invited',
      userId: inviteResult.userId,
    } as const;
    await this.workspacesService.addOrUpdateWorkspaceMember({
      ...memberInput,
      workspaceId: selectedNotebook.notebook.workspaceId,
    });
    const workspace = await this.workspacesService.findWorkspaceForMember(
      selectedNotebook.notebook.workspaceId,
      user,
    );

    const counts = await this.documentsService.countDocumentsByNotebook(
      user.subject,
      [request.notebookId],
    );

    return {
      inviteDelivery: inviteResult.delivery,
      notebook: this.toSummary(
        selectedNotebook.notebook,
        counts[request.notebookId] ?? 0,
        user,
        workspace ?? undefined,
      ),
    };
  }

  async assertNotebookAccess(notebookId: string, user: AuthenticatedUser) {
    await this.getNotebookAccess(notebookId, user);
  }

  async assertNotebookWriteAccess(notebookId: string, user: AuthenticatedUser) {
    await this.assertNotebookRole(notebookId, user, [
      'owner',
      'clinician',
      'patient',
    ]);
  }

  async assertNotebookDocumentManageAccess(
    notebookId: string,
    user: AuthenticatedUser,
  ) {
    await this.assertNotebookRole(notebookId, user, ['owner', 'clinician']);
  }

  toSummary(
    notebook: Notebook | NotebookDocument,
    sourceCount: number,
    user?: AuthenticatedUser,
    workspace?: Workspace | WorkspaceDocument,
  ): NotebookSummary {
    return {
      category: notebook.category,
      createdDateUtc: notebook.createdDateUtc,
      description: notebook.description,
      id: notebook.id,
      lastUpdatedDateUtc: notebook.lastUpdatedDateUtc,
      members: normalizeMembers(notebook, user, workspace),
      role: getMemberRole(notebook, user, workspace) ?? 'viewer',
      sourceCount,
      title: notebook.title,
      workspaceId: notebook.workspaceId,
    };
  }

  private async assertNotebookRole(
    notebookId: string,
    user: AuthenticatedUser,
    allowedRoles: NotebookMemberRole[],
  ) {
    const access = await this.getNotebookAccess(notebookId, user);
    const role = access.role;
    if (!role || !allowedRoles.includes(role)) {
      throw new ForbiddenException(
        'User is not allowed to manage this notebook.',
      );
    }

    return access;
  }

  private async getNotebookAccess(notebookId: string, user: AuthenticatedUser) {
    const notebook = await this.notebooksRepository.findById(notebookId);
    if (!notebook) {
      throw new NotFoundException('Notebook was not found.');
    }

    const workspace = await this.workspacesService.findWorkspaceForMember(
      notebook.workspaceId,
      user,
    );
    const role = getMemberRole(notebook, user, workspace ?? undefined);
    if (!role) {
      throw new NotFoundException('Notebook was not found.');
    }

    return { notebook, role, workspace: workspace ?? undefined };
  }
}

function cleanValue(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized ? normalized : fallback;
}

function normalizeEmail(email: string | null | undefined) {
  return (email ?? '').trim().toLocaleLowerCase();
}

function normalizeMembers(
  notebook: Notebook | NotebookDocument,
  user?: AuthenticatedUser,
  workspace?: Workspace | WorkspaceDocument,
) {
  const members = workspace?.members ?? notebook.members ?? [];
  if (members.length > 0) {
    return members.map((member) => ({
      email: member.email,
      role: member.role,
      status: member.status,
      userId: member.userId,
    }));
  }

  return [
    {
      email:
        user?.subject === notebook.ownerUserId
          ? normalizeEmail(user.email)
          : undefined,
      role: 'owner' as const,
      status: 'active' as const,
      userId: notebook.ownerUserId,
    },
  ];
}

function getMemberRole(
  notebook: Notebook | NotebookDocument,
  user?: AuthenticatedUser,
  workspace?: Workspace | WorkspaceDocument,
): NotebookMemberRole | undefined {
  if (!user) {
    return undefined;
  }
  const workspaceRole = getWorkspaceMemberRole(workspace, user);
  if (workspaceRole) {
    return workspaceRole;
  }
  if (notebook.ownerUserId === user.subject) {
    return 'owner';
  }

  const email = normalizeEmail(user.email);
  const member = (notebook.members ?? []).find((candidate: NotebookMember) => {
    if (candidate.userId && candidate.userId === user.subject) {
      return true;
    }

    return Boolean(email && candidate.email === email);
  });

  return member?.role;
}

function getWorkspaceMemberRole(
  workspace: Workspace | WorkspaceDocument | undefined,
  user: AuthenticatedUser,
): NotebookMemberRole | undefined {
  if (!workspace) {
    return undefined;
  }
  if (workspace.ownerUserId === user.subject) {
    return 'owner';
  }

  const email = normalizeEmail(user.email);
  const member = (workspace.members ?? []).find(
    (candidate: WorkspaceMember) => {
      if (candidate.userId && candidate.userId === user.subject) {
        return true;
      }

      return Boolean(email && candidate.email === email);
    },
  );

  return member?.role;
}
