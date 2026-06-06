import type { ExecutionContext } from '@nestjs/common';
import { AuthenticatedUserGuard } from './authenticated-user.guard';

describe('AuthenticatedUserGuard', () => {
  const originalEnvironment = process.env;

  afterEach(() => {
    process.env = originalEnvironment;
  });

  it('attaches a local user when AUTH_MODE is local', () => {
    process.env = {
      ...originalEnvironment,
      AUTH_MODE: 'local',
    };
    const request = {
      headers: {
        'x-local-user-email': 'interviewer@example.com',
        'x-local-user-id': 'interviewer-1',
        'x-local-username': 'Interviewer',
      },
    };
    const guard = new AuthenticatedUserGuard();

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
    process.env = {
      ...originalEnvironment,
      AUTH_MODE: 'local',
      LOCAL_AUTH_EMAIL: 'local@example.com',
      LOCAL_AUTH_USER_ID: 'local-1',
      LOCAL_AUTH_USERNAME: 'Local Reviewer',
    };
    const request = { headers: {} };
    const guard = new AuthenticatedUserGuard();

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

function createContext(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}
