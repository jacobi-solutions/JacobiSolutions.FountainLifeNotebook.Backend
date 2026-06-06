import type { ExecutionContext } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AuthenticatedUserGuard } from './authenticated-user.guard';

describe('AuthenticatedUserGuard', () => {
  it('attaches a local user when AUTH_MODE is local', () => {
    const request = {
      headers: {
        'x-local-user-email': 'interviewer@example.com',
        'x-local-user-id': 'interviewer-1',
        'x-local-username': 'Interviewer',
      },
    };
    const guard = new AuthenticatedUserGuard(createConfigService());

    expect(guard.canActivate(createContext(request))).toBe(true);
    expect(request).toEqual(
      expect.objectContaining({
        user: {
          email: 'interviewer@example.com',
          subject: 'interviewer-1',
          username: 'Interviewer',
        },
      }),
    );
  });

  it('uses deterministic local defaults when headers are absent', () => {
    const request = { headers: {} };
    const guard = new AuthenticatedUserGuard(createConfigService({
      localUser: {
        email: 'local@example.com',
        subject: 'local-1',
        username: 'Local Reviewer',
      },
    }));

    expect(guard.canActivate(createContext(request))).toBe(true);
    expect(request).toEqual(
      expect.objectContaining({
        user: {
          email: 'local@example.com',
          subject: 'local-1',
          username: 'Local Reviewer',
        },
      }),
    );
  });
});

function createConfigService(authOverrides: Record<string, unknown> = {}) {
  return {
    getOrThrow: jest.fn(() => ({
      authMode: 'local',
      cognitoClientId: '',
      cognitoIssuer: '',
      cognitoUserPoolId: '',
      localUser: {
        email: 'local.user@fountainlife.local',
        subject: 'local-user',
        username: 'Local User',
      },
      ...authOverrides,
    })),
  } as unknown as ConfigService;
}

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
