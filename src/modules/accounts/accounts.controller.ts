import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { BaseRequestDto } from '../../shared/contracts/base-request.dto';
import { ResponseFactory } from '../../shared/contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AccountsService } from './accounts.service';
import { CurrentUserResponseDto } from './dto/current-user-response.dto';
import { RegisterAccountResponseDto } from './dto/register-account-response.dto';

@ApiBearerAuth()
@ApiTags('accounts')
@UseGuards(AuthenticatedUserGuard)
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post('me')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: CurrentUserResponseDto })
  getMe(
    @Body() _request: BaseRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(this.accountsService.getCurrentUser(user), correlationId);
  }

  @Post('register')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: RegisterAccountResponseDto })
  async register(
    @Body() _request: BaseRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      await this.accountsService.registerCurrentUser(user),
      correlationId,
    );
  }
}
