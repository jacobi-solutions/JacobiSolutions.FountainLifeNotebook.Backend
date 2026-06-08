import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { DocumentsService } from '../documents/documents.service';
import { NotebookInvitationService } from './notebook-invitation.service';
import { NotebooksRepository } from './notebooks.repository';
import { NotebooksService } from './notebooks.service';
import { WorkspacesService } from '../workspaces/workspaces.service';

describe('NotebooksService', () => {
  it('lists member notebooks with source counts and caller role', async () => {
    const notebook = createNotebook();
    const service = createService({
      documentsService: {
        countDocumentsByNotebook: jest.fn(async () => ({ 'notebook-1': 3 })),
      } as unknown as DocumentsService,
      notebooksRepository: {
        findByMember: jest.fn(async () => [notebook]),
      } as unknown as NotebooksRepository,
    });

    await expect(service.listNotebooks(user)).resolves.toEqual([
      expect.objectContaining({
        id: 'notebook-1',
        members: [
          {
            email: 'user@example.com',
            role: 'owner',
            status: 'active',
            userId: 'user-1',
          },
        ],
        role: 'owner',
        sourceCount: 3,
        workspaceId: 'workspace-1',
      }),
    ]);
  });

  it('creates notebooks with an owner member', async () => {
    const notebook = createNotebook({
      category: 'Member notebook',
      description:
        'A focused workspace for sources, questions, citations, and Zori insights.',
      title: 'Untitled notebook',
    });
    const repository = {
      create: jest.fn(async () => notebook),
    } as unknown as NotebooksRepository;
    const service = createService({ notebooksRepository: repository });

    await expect(
      service.createNotebook(
        { category: '', description: '', title: '' },
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({ id: 'notebook-1', role: 'owner' }),
    );
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        members: [
          expect.objectContaining({
            email: 'user@example.com',
            role: 'owner',
            status: 'active',
            userId: 'user-1',
          }),
        ],
        ownerUserId: 'user-1',
        workspaceId: 'workspace-1',
      }),
    );
  });

  it('deletes notebook documents before deleting an owner notebook', async () => {
    const order: string[] = [];
    const repository = {
      deleteByIdForOwner: jest.fn(async () => {
        order.push('notebook');
        return true;
      }),
      findByIdForMember: jest.fn(async () => createNotebook()),
    } as unknown as NotebooksRepository;
    const service = createService({
      documentsService: {
        deleteNotebookDocuments: jest.fn(async () => {
          order.push('documents');
        }),
      } as unknown as DocumentsService,
      notebooksRepository: repository,
    });

    await expect(
      service.deleteNotebook('notebook-1', user),
    ).resolves.toBeUndefined();
    expect(order).toEqual(['documents', 'notebook']);
  });

  it('updates notebook metadata and returns aggregate source count', async () => {
    const updatedNotebook = createNotebook({
      category: 'Diagnostics',
      description: 'Updated description',
      title: 'Updated title',
    });
    const documentsService = {
      countDocumentsByNotebook: jest.fn(async () => ({ 'notebook-1': 4 })),
    } as unknown as DocumentsService;
    const repository = {
      findByIdForMember: jest.fn(async () => createNotebook()),
      updateByIdForOwner: jest.fn(async () => updatedNotebook),
    } as unknown as NotebooksRepository;
    const service = createService({
      documentsService,
      notebooksRepository: repository,
    });

    await expect(
      service.updateNotebook(
        {
          category: '  Diagnostics  ',
          description: '  Updated description  ',
          notebookId: 'notebook-1',
          title: '  Updated title  ',
        },
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        category: 'Diagnostics',
        description: 'Updated description',
        sourceCount: 4,
        title: 'Updated title',
      }),
    );
    expect(repository.updateByIdForOwner).toHaveBeenCalledWith(
      'notebook-1',
      'user-1',
      expect.objectContaining({
        category: 'Diagnostics',
        description: 'Updated description',
        title: 'Updated title',
      }),
    );
  });

  it('invites a member by email to the selected notebook workspace', async () => {
    const repository = {
      addOrUpdateMemberForWorkspace: jest.fn(async () =>
        createNotebook({
          members: [
            createMember(),
            {
              email: 'doctor@example.com',
              role: 'clinician',
              status: 'invited',
            },
          ],
        }),
      ),
      findByIdForMember: jest.fn(async () => createNotebook()),
    } as unknown as NotebooksRepository;
    const invitationService = {
      inviteUserByEmail: jest.fn(async () => ({
        delivery: 'cognito',
        userId: 'doctor-subject',
      })),
    } as unknown as NotebookInvitationService;
    const workspacesService = {
      addOrUpdateWorkspaceMember: jest.fn(),
    } as unknown as WorkspacesService;
    const service = createService({
      invitationService,
      notebooksRepository: repository,
      workspacesService,
    });

    await expect(
      service.inviteNotebookMember(
        {
          email: ' Doctor@Example.com ',
          notebookId: 'notebook-1',
          role: 'clinician',
        },
        user,
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        inviteDelivery: 'cognito',
        notebook: expect.objectContaining({
          members: expect.arrayContaining([
            expect.objectContaining({
              email: 'doctor@example.com',
              role: 'clinician',
              status: 'invited',
            }),
          ]),
        }),
      }),
    );
    expect(invitationService.inviteUserByEmail).toHaveBeenCalledWith(
      'doctor@example.com',
    );
    expect(repository.addOrUpdateMemberForWorkspace).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'doctor@example.com',
        notebookId: 'notebook-1',
        role: 'clinician',
        status: 'invited',
        userId: 'doctor-subject',
        workspaceId: 'workspace-1',
      }),
    );
    expect(workspacesService.addOrUpdateWorkspaceMember).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'doctor@example.com',
        role: 'clinician',
        status: 'invited',
        userId: 'doctor-subject',
        workspaceId: 'workspace-1',
      }),
    );
  });

  it('rejects inviting the current owner email as a different role', async () => {
    const repository = {
      findByIdForMember: jest.fn(async () => createNotebook()),
    } as unknown as NotebooksRepository;
    const invitationService = {
      inviteUserByEmail: jest.fn(),
    } as unknown as NotebookInvitationService;
    const service = createService({
      invitationService,
      notebooksRepository: repository,
    });

    await expect(
      service.inviteNotebookMember(
        {
          email: ' USER@example.com ',
          notebookId: 'notebook-1',
          role: 'viewer',
        },
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(invitationService.inviteUserByEmail).not.toHaveBeenCalled();
  });

  it('allows email-based invited members to access notebooks', async () => {
    const service = createService({
      notebooksRepository: {
        findByIdForMember: jest.fn(async () =>
          createNotebook({
            ownerUserId: 'owner-1',
            members: [
              createMember({ userId: 'owner-1' }),
              createMember({
                email: 'guest@example.com',
                role: 'viewer',
                status: 'invited',
                userId: undefined,
              }),
            ],
          }),
        ),
      } as unknown as NotebooksRepository,
    });

    await expect(
      service.assertNotebookAccess('notebook-1', {
        email: 'guest@example.com',
        subject: 'guest-subject',
        username: 'guest@example.com',
      }),
    ).resolves.toBeUndefined();
  });

  it('rejects viewer write access', async () => {
    const service = createService({
      notebooksRepository: {
        findByIdForMember: jest.fn(async () =>
          createNotebook({
            ownerUserId: 'owner-1',
            members: [
              createMember({ userId: 'owner-1' }),
              createMember({
                email: 'viewer@example.com',
                role: 'viewer',
                status: 'active',
                userId: 'viewer-1',
              }),
            ],
          }),
        ),
      } as unknown as NotebooksRepository,
    });

    await expect(
      service.assertNotebookWriteAccess('notebook-1', {
        email: 'viewer@example.com',
        subject: 'viewer-1',
        username: 'viewer@example.com',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('throws when asserting access to an inaccessible notebook', async () => {
    const service = createService({
      notebooksRepository: {
        findByIdForMember: jest.fn(async () => undefined),
      } as unknown as NotebooksRepository,
    });

    await expect(
      service.assertNotebookAccess('notebook-1', user),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

const user = {
  email: 'user@example.com',
  subject: 'user-1',
  username: 'user@example.com',
};

function createMember(overrides: Record<string, unknown> = {}) {
  return {
    addedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    email: 'user@example.com',
    role: 'owner',
    status: 'active',
    userId: 'user-1',
    ...overrides,
  };
}

function createNotebook(overrides: Record<string, unknown> = {}) {
  return {
    category: 'Member notebook',
    createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    description: 'Description',
    id: 'notebook-1',
    lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    members: [createMember()],
    ownerUserId: 'user-1',
    title: 'Notebook',
    workspaceId: 'workspace-1',
    ...overrides,
  };
}

function createService(
  overrides: {
    documentsService?: DocumentsService;
    invitationService?: NotebookInvitationService;
    notebooksRepository?: NotebooksRepository;
    workspacesService?: WorkspacesService;
  } = {},
) {
  return new NotebooksService(
    overrides.notebooksRepository ??
      ({
        addOrUpdateMemberForWorkspace: jest.fn(),
        create: jest.fn(),
        findByIdForMember: jest.fn(),
        findByMember: jest.fn(),
        updateByIdForOwner: jest.fn(),
      } as unknown as NotebooksRepository),
    overrides.invitationService ??
      ({
        inviteUserByEmail: jest.fn(async () => ({ delivery: 'local' })),
      } as unknown as NotebookInvitationService),
    overrides.workspacesService ??
      ({
        addOrUpdateWorkspaceMember: jest.fn(),
        ensureDefaultWorkspaceForUser: jest.fn(async () => ({
          id: 'workspace-1',
        })),
      } as unknown as WorkspacesService),
    overrides.documentsService ??
      ({
        countDocumentsByNotebook: jest.fn(async () => ({})),
        deleteNotebookDocuments: jest.fn(),
      } as unknown as DocumentsService),
  );
}
