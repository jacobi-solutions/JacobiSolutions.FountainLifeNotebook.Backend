import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { from, Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AccountsService } from './accounts.service';

type RequestWithUser = Request & { user?: AuthenticatedUser };

@Injectable()
export class AccountRegistrationInterceptor implements NestInterceptor {
  constructor(private readonly accountsService: AccountsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) {
      return next.handle();
    }

    return from(this.accountsService.ensureCurrentUser(request.user)).pipe(
      mergeMap(() => next.handle()),
    );
  }
}
