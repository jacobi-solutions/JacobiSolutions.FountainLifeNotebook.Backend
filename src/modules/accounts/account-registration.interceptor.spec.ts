import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { AccountsService } from './accounts.service';
import { AccountRegistrationInterceptor } from './account-registration.interceptor';

describe('AccountRegistrationInterceptor', () => {
  it('upserts authenticated users before continuing the request', async () => {
    const accountsService = {
      ensureCurrentUser: jest.fn(async () => ({
        cognitoSubject: 'subject-1',
        email: 'user@example.com',
        id: 'account-1',
        username: 'user@example.com',
      })),
    } as unknown as AccountsService;
    const interceptor = new AccountRegistrationInterceptor(accountsService);
    const next = { handle: jest.fn(() => of('ok')) } as unknown as CallHandler;
    const user = {
      email: 'user@example.com',
      subject: 'subject-1',
      username: 'user@example.com',
    };

    await expect(
      lastValueFrom(interceptor.intercept(createContext({ user }), next)),
    ).resolves.toBe('ok');

    expect(accountsService.ensureCurrentUser).toHaveBeenCalledWith(user);
    expect(next.handle).toHaveBeenCalled();
  });

  it('skips anonymous requests', async () => {
    const accountsService = {
      ensureCurrentUser: jest.fn(),
    } as unknown as AccountsService;
    const interceptor = new AccountRegistrationInterceptor(accountsService);
    const next = { handle: jest.fn(() => of('ok')) } as unknown as CallHandler;

    await expect(
      lastValueFrom(interceptor.intercept(createContext({}), next)),
    ).resolves.toBe('ok');

    expect(accountsService.ensureCurrentUser).not.toHaveBeenCalled();
    expect(next.handle).toHaveBeenCalled();
  });
});

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
