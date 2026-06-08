import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { NotebooksRepository } from './notebooks.repository';

@Injectable()
export class NotebookWorkspaceBackfillService implements OnApplicationBootstrap {
  private readonly logger = new Logger(NotebookWorkspaceBackfillService.name);

  constructor(
    private readonly notebooksRepository: NotebooksRepository,
    private readonly workspacesService: WorkspacesService,
  ) {}

  async onApplicationBootstrap() {
    const notebooks = await this.notebooksRepository.findWithoutWorkspaceId();
    if (notebooks.length === 0) {
      return;
    }

    let updated = 0;
    let failed = 0;
    for (const notebook of notebooks) {
      try {
        const workspace =
          await this.workspacesService.ensureDefaultWorkspaceForNotebook(
            notebook,
          );
        const didUpdate = await this.notebooksRepository.assignWorkspaceId(
          notebook.id,
          workspace.id,
        );
        if (didUpdate) {
          updated += 1;
        } else {
          this.logger.debug({
            event: 'notebooks.workspace_id_backfill_skipped',
            notebookId: notebook.id,
          });
        }
      } catch (error) {
        failed += 1;
        this.logger.error({
          error: error instanceof Error ? error.message : String(error),
          event: 'notebooks.workspace_id_backfill_failed',
          notebookId: notebook.id,
        });
      }
    }

    this.logger.log({
      failed,
      event: 'notebooks.workspace_id_backfilled',
      notebooks: updated,
    });
  }
}
