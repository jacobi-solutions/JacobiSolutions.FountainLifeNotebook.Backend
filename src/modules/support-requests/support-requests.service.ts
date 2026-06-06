import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthenticatedUser } from '../auth/models/authenticated-user';
import { SupportRequestDto } from './dto/support-request.dto';
import { SupportRequestDocument, SupportRequestPriority } from './schemas/support-request.schema';
import { SupportRequestsRepository } from './support-requests.repository';

export interface CreateSupportRequestInput {
  category?: string;
  description: string;
  priority?: string;
  subject: string;
}

@Injectable()
export class SupportRequestsService {
  private readonly allowedPriorities = new Set<SupportRequestPriority>(['high', 'low', 'normal']);

  constructor(private readonly supportRequestsRepository: SupportRequestsRepository) {}

  async create(input: CreateSupportRequestInput, user: AuthenticatedUser): Promise<SupportRequestDto> {
    const subject = this.normalizeRequiredText(input.subject, 'subject');
    const description = this.normalizeRequiredText(input.description, 'description');
    const priority = this.normalizePriority(input.priority);
    const category = this.normalizeOptionalText(input.category) ?? 'general';

    const supportRequest = await this.supportRequestsRepository.create({
      category,
      createdByUserId: user.subject,
      description,
      priority,
      status: 'open',
      subject,
    });

    return this.toDto(supportRequest);
  }

  private normalizeRequiredText(value: string | undefined, fieldName: string) {
    const normalized = this.normalizeOptionalText(value);
    if (!normalized) {
      throw new BadRequestException(`${fieldName} is required.`);
    }

    return normalized;
  }

  private normalizeOptionalText(value: string | undefined) {
    const normalized = value?.trim().replace(/\s+/g, ' ');
    return normalized && normalized.length > 0 ? normalized : undefined;
  }

  private normalizePriority(priority: string | undefined): SupportRequestPriority {
    const normalized = this.normalizeOptionalText(priority)?.toLowerCase() ?? 'normal';
    if (!this.allowedPriorities.has(normalized as SupportRequestPriority)) {
      throw new BadRequestException('priority must be one of high, low, or normal.');
    }

    return normalized as SupportRequestPriority;
  }

  private toDto(supportRequest: SupportRequestDocument): SupportRequestDto {
    return {
      category: supportRequest.category,
      createdByUserId: supportRequest.createdByUserId,
      createdDateUtc: supportRequest.createdDateUtc,
      description: supportRequest.description,
      id: supportRequest.id,
      priority: supportRequest.priority,
      status: supportRequest.status,
      subject: supportRequest.subject,
    };
  }
}
