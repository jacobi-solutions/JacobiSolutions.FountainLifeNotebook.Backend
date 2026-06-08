import { AccountsService } from './accounts.service';

describe('AccountsService', () => {
  it('returns the current authenticated user', () => {
    const service = new AccountsService({} as never);
    const user = {
      email: 'user@example.com',
      subject: 'subject-1',
      username: 'user@example.com',
    };

    expect(service.getCurrentUser(user)).toBe(user);
  });

  it('registers the current user through the repository', async () => {
    const repository = {
      upsertAccount: jest.fn().mockResolvedValue({
        cognitoSubject: 'subject-1',
        email: 'user@example.com',
        id: 'account-1',
        username: 'user@example.com',
      }),
    };
    const service = new AccountsService(repository as never);

    await expect(
      service.registerCurrentUser({
        email: 'user@example.com',
        subject: 'subject-1',
        username: 'user@example.com',
      }),
    ).resolves.toEqual({
      cognitoSubject: 'subject-1',
      email: 'user@example.com',
      id: 'account-1',
      username: 'user@example.com',
    });
    expect(repository.upsertAccount).toHaveBeenCalledWith({
      cognitoSubject: 'subject-1',
      email: 'user@example.com',
      username: 'user@example.com',
    });
  });

  it('ensures the current user through the repository', async () => {
    const account = {
      cognitoSubject: 'subject-1',
      email: 'user@example.com',
      id: 'account-1',
      username: 'user@example.com',
    };
    const repository = {
      upsertAccount: jest.fn().mockResolvedValue(account),
    };
    const service = new AccountsService(repository as never);

    await expect(
      service.ensureCurrentUser({
        email: 'user@example.com',
        subject: 'subject-1',
        username: 'user@example.com',
      }),
    ).resolves.toBe(account);
  });
});
