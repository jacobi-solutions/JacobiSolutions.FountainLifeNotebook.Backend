import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AccountResponseDto } from './dto/account-response.dto';
import { AccountsRepository } from './accounts.repository';
import { AccountDocument } from './schemas/account.schema';

@Injectable()
export class AccountsService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  getCurrentUser(user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  async registerCurrentUser(user: AuthenticatedUser): Promise<AccountResponseDto> {
    const account = await this.accountsRepository.upsertAccount({
      cognitoSubject: user.subject,
      email: user.email ?? `${user.subject}@unknown.local`,
      username: user.username,
    });

    return this.toDto(account);
  }

  private toDto(account: AccountDocument): AccountResponseDto {
    return {
      id: account.id,
      cognitoSubject: account.cognitoSubject,
      email: account.email,
      username: account.username,
    };
  }
}
