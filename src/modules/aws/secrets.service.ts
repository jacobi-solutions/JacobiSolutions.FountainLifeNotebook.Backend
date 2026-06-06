import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AwsConfig } from '../../shared/config/app.config';

@Injectable()
export class SecretsService {
  private readonly client: SecretsManagerClient;

  constructor(configService: ConfigService) {
    const aws = configService.getOrThrow<AwsConfig>('aws');
    this.client = new SecretsManagerClient({ region: aws.region });
  }

  async getSecretString(secretId: string): Promise<string> {
    const response = await this.client.send(new GetSecretValueCommand({ SecretId: secretId }));

    if (response.SecretString) {
      return response.SecretString;
    }

    if (response.SecretBinary) {
      return Buffer.from(response.SecretBinary).toString('utf8');
    }

    throw new Error(`Secret '${secretId}' did not contain a value.`);
  }

  async getJsonSecret<TValue>(secretId: string): Promise<TValue> {
    return JSON.parse(await this.getSecretString(secretId)) as TValue;
  }
}
