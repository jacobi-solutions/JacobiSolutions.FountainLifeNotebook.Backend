import { ApiProperty } from '@nestjs/swagger';
import { BaseResponseDto } from '../../../shared/contracts/base-response.dto';
import { AuthenticatedUserDto } from '../../auth/dto/authenticated-user.dto';

export class CurrentUserResponseDto extends BaseResponseDto<AuthenticatedUserDto> {
  @ApiProperty({ type: AuthenticatedUserDto })
  declare data?: AuthenticatedUserDto;
}
