import { sanitizeForLog } from './request-response-logging.interceptor';

describe('sanitizeForLog', () => {
  it('redacts tokens, identity values, and user-authored content recursively', () => {
    expect(
      sanitizeForLog({
        authorization: 'Bearer token',
        payload: {
          message: 'Create a support request.',
          safeMetadata: {
            count: 1,
          },
        },
        user: {
          email: 'user@example.com',
          subject: 'subject-1',
        },
      }),
    ).toEqual({
      authorization: '[REDACTED]',
      payload: '[REDACTED]',
      user: {
        email: '[REDACTED]',
        subject: '[REDACTED]',
      },
    });
  });
});
