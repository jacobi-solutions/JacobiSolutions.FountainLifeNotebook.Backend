import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BaseRequest } from '../../shared/data-contracts/base-request';
import { ResponseFactory } from '../../shared/data-contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AccountsService } from './accounts.service';
import { CurrentUserResponse } from './data-contracts/current-user-response';
import { RegisterAccountResponse } from './data-contracts/register-account-response';

@ApiBearerAuth()
@ApiTags('accounts')
@UseGuards(AuthenticatedUserGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('get-current-account')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CurrentUserResponse })
  getCurrentAccount(
    @Body() _request: BaseRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      this.accountsService.getCurrentUser(user),
      correlationId,
    );
  }

  @Post('register-current-account')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RegisterAccountResponse })
  async registerCurrentAccount(
    @Body() _request: BaseRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      await this.accountsService.registerCurrentUser(user),
      correlationId,
    );
  }
}
