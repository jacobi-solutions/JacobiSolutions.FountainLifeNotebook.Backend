import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AccountSummary } from './data-contracts/account-summary';
import { AccountsRepository } from './accounts.repository';
import { AccountDocument } from './schemas/account.schema';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  getCurrentUser(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  async registerCurrentUser(user: AuthenticatedUser): Promise<AccountSummary> {
    const account = await this.accountsRepository.upsertAccount({
      cognitoSubject: user.subject,
      email: user.email ?? `${user.subject}@unknown.local`,
      username: user.username,
    });

    return this.toSummary(account);
  }

  private toSummary(account: AccountDocument): AccountSummary {
    return {
      id: account.id,
      cognitoSubject: account.cognitoSubject,
      email: account.email,
      username: account.username,
    };
  }
}
