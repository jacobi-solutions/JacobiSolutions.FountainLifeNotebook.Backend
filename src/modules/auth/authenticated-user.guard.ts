import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { AuthConfig } from '../../shared/config/app.config';
import type { AuthenticatedUser } from './models/authenticated-user';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuthenticatedUserGuard extends AuthGuard('jwt') {
  constructor(private readonly configService: ConfigService) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const config = this.configService.getOrThrow<AuthConfig>('auth');
    if (config.authMode !== 'cognito') {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      request.user = localUserFromHeaders(request, config.localUser);
      return true;
    }

    return super.canActivate(context);
  }
}

function localUserFromHeaders(
  request: Request,
  configuredUser: AuthenticatedUser,
): AuthenticatedUser {
  const subject = firstHeader(request.headers['x-local-user-id']) ?? configuredUser.subject;
  const email =
    firstHeader(request.headers['x-local-user-email']) ??
    configuredUser.email;

  return {
    email,
    subject,
    username:
      firstHeader(request.headers['x-local-username']) ??
      configuredUser.username ??
      email ??
      subject,
  };
}

function firstHeader(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
