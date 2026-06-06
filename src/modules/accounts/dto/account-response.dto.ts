import { ApiProperty } from '@nestjs/swagger';

export class AccountResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  cognitoSubject!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty()
  username!: string;
}
