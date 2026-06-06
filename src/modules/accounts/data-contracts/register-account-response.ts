import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AccountSummary } from './account-summary';

export class RegisterAccountResponse extends BaseResponse<AccountSummary> {
  @ApiProperty({ type: AccountSummary })
  declare data?: AccountSummary;
}
