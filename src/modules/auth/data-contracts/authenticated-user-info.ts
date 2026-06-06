import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserInfo {
  @ApiProperty({ nullable: true, type: String })
  email!: string | null;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  username!: string;
}
