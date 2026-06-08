import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AlertcheckResponse } from './data-contracts/alertcheck-response';
import { AlertcheckService } from './alertcheck.service';

@ApiTags('alertcheck')
@UseGuards(AuthenticatedUserGuard)
@Controller('alertcheck')
export class AlertcheckController {
  constructor(private readonly alertcheckService: AlertcheckService) {}

  @Get()
  @ApiOkResponse({ type: AlertcheckResponse })
  triggerAlertcheck(@CurrentUser() user: AuthenticatedUser) {
    return this.alertcheckService.triggerTestAlert(user);
  }
}
