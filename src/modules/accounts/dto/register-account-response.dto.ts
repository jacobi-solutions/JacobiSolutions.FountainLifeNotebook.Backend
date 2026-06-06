import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { AccountResponseDto } from './account-response.dto';

export class RegisterAccountResponseDto extends BaseResponseDto<AccountResponseDto> {
  @ApiProperty({ type: AccountResponseDto })
  declare data?: AccountResponseDto;
}
