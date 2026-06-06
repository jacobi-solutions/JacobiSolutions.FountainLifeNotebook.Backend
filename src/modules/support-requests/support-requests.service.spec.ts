import { BadRequestException } from '@nestjs/common';
import { SupportRequestsRepository } from './support-requests.repository';
import { SupportRequestsService } from './support-requests.service';

describe('SupportRequestsService', () => {
  it('normalizes and creates support requests', async () => {
    const repository = {
      create: jest.fn(async (input) => ({
        ...input,
        createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
        id: 'support-1',
      })),
    } as unknown as SupportRequestsRepository;
    const service = new SupportRequestsService(repository);

    await expect(
      service.create(
        {
          category: ' billing ',
          description: ' Something   broke ',
          priority: 'HIGH',
          subject: ' Need   help ',
        },
        { email: 'user@example.com', subject: 'user-1', username: 'User' },
      ),
    ).resolves.toEqual(
      expect.objectContaining({
        category: 'billing',
        createdByUserId: 'user-1',
        description: 'Something broke',
        id: 'support-1',
        priority: 'high',
        status: 'open',
        subject: 'Need help',
      }),
    );
  });

  it('rejects unsupported priorities', async () => {
    const service = new SupportRequestsService({} as SupportRequestsRepository);

    await expect(
      service.create(
        {
          description: 'Details',
          priority: 'urgent',
          subject: 'Need help',
        },
        { email: 'user@example.com', subject: 'user-1', username: 'User' },
      ),
    ).rejects.toThrow(BadRequestException);
  });
});
