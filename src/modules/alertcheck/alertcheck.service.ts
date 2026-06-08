import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { type MonitoringConfig } from '../../shared/config/app.config';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { AlertcheckResponse } from './data-contracts/alertcheck-response';

@Injectable()
export class AlertcheckService {
  private readonly allowedEmails: Set<string>;
  private readonly client?: SNSClient;
  private readonly topicArn?: string;

  constructor(configService: ConfigService) {
    const monitoringConfig =
      configService.getOrThrow<MonitoringConfig>('monitoring');
    this.allowedEmails = new Set(monitoringConfig.alertcheckAllowedEmails);
    this.topicArn = monitoringConfig.alertTopicArn;

    if (this.topicArn) {
      this.client = new SNSClient({
        region: monitoringConfig.alertTopicRegion,
      });
    }
  }

  async triggerTestAlert(user: AuthenticatedUser): Promise<AlertcheckResponse> {
    const userEmail = user.email?.trim().toLocaleLowerCase();
    if (!userEmail || !this.allowedEmails.has(userEmail)) {
      throw new ForbiddenException('Alertcheck access is not allowed.');
    }

    if (!this.topicArn || !this.client) {
      throw new ServiceUnavailableException(
        'Alert notifications are not configured.',
      );
    }

    const timestamp = new Date().toISOString();
    const response = await this.client.send(
      new PublishCommand({
        TopicArn: this.topicArn,
        Subject: 'Fountain Life Notebook test alert',
        Message: [
          'This is a test alert from the Fountain Life Notebook alertcheck endpoint.',
          `Timestamp: ${timestamp}`,
        ].join('\n'),
      }),
    );

    if (!response.MessageId) {
      throw new InternalServerErrorException(
        'Alert notification publish did not return a message id.',
      );
    }

    return {
      messageId: response.MessageId,
      name: 'fountain-life-notebook-alertcheck',
      status: 'sent',
      timestamp,
    };
  }
}
