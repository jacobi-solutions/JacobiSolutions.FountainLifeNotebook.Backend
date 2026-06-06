import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { AuthenticatedUserGuard } from './authenticated-user.guard';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [AuthenticatedUserGuard, JwtStrategy],
  exports: [AuthenticatedUserGuard, PassportModule],
})
export class AuthModule {}
