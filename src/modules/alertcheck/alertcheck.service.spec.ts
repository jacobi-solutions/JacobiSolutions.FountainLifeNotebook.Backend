import { SNSClient } from '@aws-sdk/client-sns';
import { ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { AlertcheckService } from './alertcheck.service';

describe('AlertcheckService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('publishes a test alert when monitoring is configured', async () => {
    const send = jest
      .spyOn(SNSClient.prototype, 'send')
      .mockResolvedValue({ MessageId: 'message-123' });

    const service = new AlertcheckService(
      createConfigService({
        alertcheckAllowedEmails: ['alerts@example.com'],
        alertTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
        alertTopicRegion: 'us-east-1',
      }),
    );

    await expect(service.triggerTestAlert(createUser())).resolves.toEqual(
      expect.objectContaining({
        messageId: 'message-123',
        name: 'fountain-life-notebook-alertcheck',
        status: 'sent',
      }),
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].input).toEqual(
      expect.objectContaining({
        Subject: 'Fountain Life Notebook test alert',
        TopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
      }),
    );
  });

  it('fails when monitoring is not configured', async () => {
    const service = new AlertcheckService(
      createConfigService({ alertcheckAllowedEmails: ['alerts@example.com'] }),
    );

    await expect(service.triggerTestAlert(createUser())).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('rejects authenticated users outside the allowlist', async () => {
    const service = new AlertcheckService(
      createConfigService({
        alertcheckAllowedEmails: ['alerts@example.com'],
        alertTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
        alertTopicRegion: 'us-east-1',
      }),
    );

    await expect(
      service.triggerTestAlert(createUser('other@example.com')),
    ).rejects.toThrow('Alertcheck access is not allowed.');
  });

  it('fails when SNS does not return a message id', async () => {
    jest.spyOn(SNSClient.prototype, 'send').mockResolvedValue({});

    const service = new AlertcheckService(
      createConfigService({
        alertcheckAllowedEmails: ['alerts@example.com'],
        alertTopicArn: 'arn:aws:sns:us-east-1:123456789012:alerts',
        alertTopicRegion: 'us-east-1',
      }),
    );

    await expect(service.triggerTestAlert(createUser())).rejects.toThrow(
      'Alert notification publish did not return a message id.',
    );
  });
});

function createConfigService(
  monitoring: {
    alertcheckAllowedEmails?: string[];
    alertTopicArn?: string;
    alertTopicRegion?: string;
  } = {},
): ConfigService {
  return {
    getOrThrow: jest.fn((key: string) => {
      if (key === 'monitoring') {
        return {
          alertcheckAllowedEmails: [],
          alertTopicRegion: 'us-east-1',
          ...monitoring,
        };
      }

      throw new Error(`Unexpected config key: ${key}`);
    }),
  } as unknown as ConfigService;
}

function createUser(email = 'alerts@example.com') {
  return {
    email,
    subject: 'user-1',
    username: email,
  };
}
