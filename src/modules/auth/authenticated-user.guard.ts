import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from './models/authenticated-user';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class AuthenticatedUserGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    if ((process.env.AUTH_MODE ?? 'local') !== 'cognito') {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      request.user = localUserFromHeaders(request);
      return true;
    }

    return super.canActivate(context);
  }
}

function localUserFromHeaders(request: Request): AuthenticatedUser {
  const subject = firstHeader(request.headers['x-local-user-id']) ?? process.env.LOCAL_AUTH_USER_ID ?? 'local-user';
  const email =
    firstHeader(request.headers['x-local-user-email']) ??
    process.env.LOCAL_AUTH_EMAIL ??
    'local.user@fountainlife.local';

  return {
    email,
    subject,
    username:
      firstHeader(request.headers['x-local-username']) ??
      process.env.LOCAL_AUTH_USERNAME ??
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
