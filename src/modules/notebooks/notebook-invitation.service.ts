import {
  AdminCreateUserCommand,
  AdminGetUserCommand,
  CognitoIdentityProviderClient,
  UserNotFoundException,
  UsernameExistsException,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthConfig, AwsConfig } from '../../shared/config/app.config';

export type NotebookInviteDelivery = 'cognito' | 'local' | 'existing-user';
export interface NotebookInviteResult {
  delivery: NotebookInviteDelivery;
  userId?: string;
}

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

  async inviteUserByEmail(email: string): Promise<NotebookInviteResult> {
    if (this.authConfig.authMode !== 'cognito') {
      return { delivery: 'local' };
    }
    if (!this.client) {
      throw new Error('Cognito invite client is not configured.');
    }

    try {
      const response = await this.client.send(
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

      return {
        delivery: 'cognito',
        userId: extractCognitoSub(response.User?.Attributes),
      };
    } catch (error) {
      if (error instanceof UsernameExistsException) {
        const existingUserId = await this.findExistingUserId(email);

        return {
          delivery: 'existing-user',
          userId: existingUserId,
        };
      }

      throw error;
    }
  }

  private async findExistingUserId(email: string) {
    try {
      const existingUser = await this.client?.send(
        new AdminGetUserCommand({
          Username: email,
          UserPoolId: this.authConfig.cognitoUserPoolId,
        }),
      );

      return extractCognitoSub(existingUser?.UserAttributes);
    } catch (error) {
      if (error instanceof UserNotFoundException) {
        return undefined;
      }

      throw error;
    }
  }
}

function extractCognitoSub(attributes: AttributeType[] | undefined) {
  return attributes?.find((attribute) => attribute.Name === 'sub')?.Value;
}
