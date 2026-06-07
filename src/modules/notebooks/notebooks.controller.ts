import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BaseResponse } from '../../shared/data-contracts/base-response';
import { ResponseFactory } from '../../shared/data-contracts/response-factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { CreateNotebookRequest } from './data-contracts/create-notebook-request';
import { CreateNotebookResponse } from './data-contracts/create-notebook-response';
import { DeleteNotebookRequest } from './data-contracts/delete-notebook-request';
import { InviteNotebookMemberRequest } from './data-contracts/invite-notebook-member-request';
import { InviteNotebookMemberResponse } from './data-contracts/invite-notebook-member-response';
import { ListNotebooksRequest } from './data-contracts/list-notebooks-request';
import { ListNotebooksResponse } from './data-contracts/list-notebooks-response';
import { UpdateNotebookRequest } from './data-contracts/update-notebook-request';
import { UpdateNotebookResponse } from './data-contracts/update-notebook-response';
import { NotebooksService } from './notebooks.service';

@ApiBearerAuth()
@ApiTags('notebooks')
@UseGuards(AuthenticatedUserGuard)
@Controller('notebooks')
export class NotebooksController {
  constructor(private readonly notebooksService: NotebooksService) {}

  @Post('list-notebooks')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListNotebooksResponse })
  async listNotebooks(
    @Body() _request: ListNotebooksRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.successWith(
      { notebooks: await this.notebooksService.listNotebooks(user) },
      correlationId,
    );
  }

  @Post('create-notebook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CreateNotebookResponse })
  async createNotebook(
    @Body() request: CreateNotebookRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.successWith(
      { notebook: await this.notebooksService.createNotebook(request, user) },
      correlationId,
    );
  }

  @Post('update-notebook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: UpdateNotebookResponse })
  async updateNotebook(
    @Body() request: UpdateNotebookRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.notebookId) {
      return ResponseFactory.failure(
        {
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Notebook id is required.',
        },
        correlationId,
      );
    }

    return ResponseFactory.successWith(
      { notebook: await this.notebooksService.updateNotebook(request, user) },
      correlationId,
    );
  }

  @Post('delete-notebook')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BaseResponse })
  async deleteNotebook(
    @Body() request: DeleteNotebookRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.notebookId) {
      return ResponseFactory.failure(
        {
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Notebook id is required.',
        },
        correlationId,
      );
    }

    await this.notebooksService.deleteNotebook(request.notebookId, user);
    return ResponseFactory.success(correlationId);
  }

  @Post('invite-notebook-member')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: InviteNotebookMemberResponse })
  async inviteNotebookMember(
    @Body() request: InviteNotebookMemberRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    const result = await this.notebooksService.inviteNotebookMember(
      request,
      user,
    );

    return ResponseFactory.successWith(result, correlationId);
  }
}
