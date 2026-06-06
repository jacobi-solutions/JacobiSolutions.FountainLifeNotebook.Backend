import { ApiProperty } from '@nestjs/swagger';

export class AuthenticatedUserDto {
  @ApiProperty({ nullable: true, type: String })
  email!: string | null;

  @ApiProperty()
  subject!: string;

  @ApiProperty()
  username!: string;
}
