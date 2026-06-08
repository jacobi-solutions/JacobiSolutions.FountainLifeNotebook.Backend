import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotebookWorkspaceBackfillService } from './notebook-workspace-backfill.service';
import { NotebooksRepository } from './notebooks.repository';

describe('NotebookWorkspaceBackfillService', () => {
  it('creates default workspaces and writes workspace ids to legacy notebooks', async () => {
    const notebooksRepository = {
      assignWorkspaceId: jest.fn(async () => true),
      findWithoutWorkspaceId: jest.fn(async () => [
        {
          id: 'notebook-1',
          members: [],
          ownerUserId: 'owner-1',
        },
      ]),
    } as unknown as NotebooksRepository;
    const workspacesService = {
      ensureDefaultWorkspaceForNotebook: jest.fn(async () => ({
        id: 'workspace-1',
      })),
    } as unknown as WorkspacesService;
    const service = new NotebookWorkspaceBackfillService(
      notebooksRepository,
      workspacesService,
    );

    await service.onApplicationBootstrap();

    expect(
      workspacesService.ensureDefaultWorkspaceForNotebook,
    ).toHaveBeenCalledWith(expect.objectContaining({ id: 'notebook-1' }));
    expect(notebooksRepository.assignWorkspaceId).toHaveBeenCalledWith(
      'notebook-1',
      'workspace-1',
    );
  });

  it('continues when a legacy notebook was already assigned by another process', async () => {
    const notebooksRepository = {
      assignWorkspaceId: jest.fn(async () => false),
      findWithoutWorkspaceId: jest.fn(async () => [
        {
          id: 'notebook-1',
          members: [],
          ownerUserId: 'owner-1',
        },
      ]),
    } as unknown as NotebooksRepository;
    const workspacesService = {
      ensureDefaultWorkspaceForNotebook: jest.fn(async () => ({
        id: 'workspace-1',
      })),
    } as unknown as WorkspacesService;
    const service = new NotebookWorkspaceBackfillService(
      notebooksRepository,
      workspacesService,
    );

    await service.onApplicationBootstrap();

    expect(notebooksRepository.assignWorkspaceId).toHaveBeenCalledWith(
      'notebook-1',
      'workspace-1',
    );
  });

  it('continues when workspace creation fails for one legacy notebook', async () => {
    const notebooksRepository = {
      assignWorkspaceId: jest.fn(),
      findWithoutWorkspaceId: jest.fn(async () => [
        {
          id: 'notebook-1',
          members: [],
          ownerUserId: 'owner-1',
        },
        {
          id: 'notebook-2',
          members: [],
          ownerUserId: 'owner-2',
        },
      ]),
    } as unknown as NotebooksRepository;
    const workspacesService = {
      ensureDefaultWorkspaceForNotebook: jest
        .fn()
        .mockRejectedValueOnce(new Error('workspace failed'))
        .mockResolvedValueOnce({ id: 'workspace-2' }),
    } as unknown as WorkspacesService;
    const service = new NotebookWorkspaceBackfillService(
      notebooksRepository,
      workspacesService,
    );

    await service.onApplicationBootstrap();

    expect(notebooksRepository.assignWorkspaceId).toHaveBeenCalledTimes(1);
    expect(notebooksRepository.assignWorkspaceId).toHaveBeenCalledWith(
      'notebook-2',
      'workspace-2',
    );
  });

  it('does nothing when no notebooks need backfill', async () => {
    const notebooksRepository = {
      assignWorkspaceId: jest.fn(),
      findWithoutWorkspaceId: jest.fn(async () => []),
    } as unknown as NotebooksRepository;
    const workspacesService = {
      ensureDefaultWorkspaceForNotebook: jest.fn(),
    } as unknown as WorkspacesService;
    const service = new NotebookWorkspaceBackfillService(
      notebooksRepository,
      workspacesService,
    );

    await service.onApplicationBootstrap();

    expect(
      workspacesService.ensureDefaultWorkspaceForNotebook,
    ).not.toHaveBeenCalled();
    expect(notebooksRepository.assignWorkspaceId).not.toHaveBeenCalled();
  });
});
