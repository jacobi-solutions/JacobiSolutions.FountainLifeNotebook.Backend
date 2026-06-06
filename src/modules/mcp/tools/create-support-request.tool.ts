import { Injectable } from '@nestjs/common';
import { SupportRequestsService } from '../../support-requests/support-requests.service';
import { McpToolContext } from '../mcp-tool-context';
import { McpToolHandler } from '../mcp-tool-handler';
import { McpToolExecutionResult } from '../mcp-tool-execution-result';

@Injectable()
export class CreateSupportRequestTool implements McpToolHandler {
  readonly description = 'Creates a support request for the current authenticated user.';
  readonly inputSchema = {
    additionalProperties: false,
    properties: {
      category: { type: 'string' },
      description: { type: 'string' },
      priority: { enum: ['high', 'low', 'normal'], type: 'string' },
      subject: { type: 'string' },
    },
    required: ['subject', 'description'],
    type: 'object',
  };
  readonly name = 'support.create_request';

  constructor(private readonly supportRequestsService: SupportRequestsService) {}

  async execute(argumentsPayload: Record<string, unknown>, context: McpToolContext): Promise<McpToolExecutionResult> {
    const supportRequest = await this.supportRequestsService.create(
      {
        category: this.getString(argumentsPayload.category),
        description: this.getRequiredString(argumentsPayload.description, 'description'),
        priority: this.getString(argumentsPayload.priority),
        subject: this.getRequiredString(argumentsPayload.subject, 'subject'),
      },
      context.user,
    );

    return {
      structuredContent: { supportRequest },
      text: `Created support request ${supportRequest.id}.`,
    };
  }

  private getRequiredString(value: unknown, fieldName: string) {
    const text = this.getString(value);
    if (!text) {
      throw new Error(`${fieldName} is required.`);
    }

    return text;
  }

  private getString(value: unknown) {
    return typeof value === 'string' ? value : undefined;
  }
}
