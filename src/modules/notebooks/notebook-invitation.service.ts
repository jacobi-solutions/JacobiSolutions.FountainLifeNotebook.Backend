import {
  AdminCreateUserCommand,
  CognitoIdentityProviderClient,
  UsernameExistsException,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig, AwsConfig } from '../../shared/config/app.config';

export type NotebookInviteDelivery = 'cognito' | 'local' | 'existing-user';

@Injectable()
export class NotebookInvitationService {
  private readonly authConfig: AuthConfig;
  private readonly client?: CognitoIdentityProviderClient;

  constructor(configService: ConfigService) {
    this.authConfig = configService.getOrThrow<AuthConfig>('auth');
    const awsConfig = configService.getOrThrow<AwsConfig>('aws');

    if (this.authConfig.authMode === 'cognito') {
      this.client = new CognitoIdentityProviderClient({
        region: awsConfig.region,
      });
    }
  }

  async inviteUserByEmail(email: string): Promise<NotebookInviteDelivery> {
    if (this.authConfig.authMode !== 'cognito') {
      return 'local';
    }
    if (!this.client) {
      throw new Error('Cognito invite client is not configured.');
    }

    try {
      await this.client.send(
        new AdminCreateUserCommand({
          DesiredDeliveryMediums: ['EMAIL'],
          UserAttributes: [
            { Name: 'email', Value: email },
            { Name: 'email_verified', Value: 'true' },
          ],
          Username: email,
          UserPoolId: this.authConfig.cognitoUserPoolId,
        }),
      );

      return 'cognito';
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        return 'existing-user';
      }

      throw error;
    }
  }
}
