import { ApiProperty } from '@nestjs/swagger';
import { BaseResponse } from '../../../shared/data-contracts/base-response';
import { AuthenticatedUserInfo } from '../../auth/data-contracts/authenticated-user-info';

export class CurrentUserResponse extends BaseResponse<AuthenticatedUserInfo> {
  @ApiProperty({ type: AuthenticatedUserInfo })
  declare data?: AuthenticatedUserInfo;
}
