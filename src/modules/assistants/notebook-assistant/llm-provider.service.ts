import { Injectable, Logger } from '@nestjs/common';
import {
  BedrockRuntimeClient,
  ConverseCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { ConfigService } from '@nestjs/config';
import type { AwsConfig, LlmConfig } from '../../../shared/config/app.config';
import type { RetrievedNotebookChunk } from './notebook-retrieval.service';

export interface GenerateNotebookAnswerRequest {
  chunks: RetrievedNotebookChunk[];
  question: string;
}

@Injectable()
export class LlmProviderService {
  private readonly logger = new Logger(LlmProviderService.name);
  private readonly bedrockClient?: BedrockRuntimeClient;
  private readonly config: LlmConfig;

  constructor(configService: ConfigService) {
    this.config = configService.getOrThrow<LlmConfig>('llm');
    if (this.config.llmProvider === 'bedrock') {
      const awsConfig = configService.getOrThrow<AwsConfig>('aws');
      this.bedrockClient = new BedrockRuntimeClient({
        region: awsConfig.region,
      });
    }
  }

  async generateAnswer(request: GenerateNotebookAnswerRequest) {
    if (this.config.llmProvider === 'bedrock') {
      return this.generateBedrockAnswer(request);
    }

    return this.generateMockAnswer(request);
  }

  private async generateBedrockAnswer(request: GenerateNotebookAnswerRequest) {
    if (!this.bedrockClient) {
      throw new Error('Bedrock client is not configured.');
    }
    if (!this.config.bedrockModelId) {
      throw new Error('Bedrock model id is not configured.');
    }

    try {
      const response = await this.bedrockClient.send(
        new ConverseCommand({
          inferenceConfig: {
            maxTokens: 1200,
            temperature: 0.2,
          },
          messages: [
            {
              content: [{ text: buildPrompt(request) }],
              role: 'user',
            },
          ],
          modelId: this.config.bedrockModelId,
        }),
      );

      return stringifyMessageContent(response.output?.message?.content);
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        event: 'bedrock.invoke_failed',
        modelId: this.config.bedrockModelId,
      });
      throw error;
    }
  }

  private generateMockAnswer(request: GenerateNotebookAnswerRequest) {
    const leadIn =
      request.chunks.length === 1
        ? 'I found one relevant section in your documents.'
        : `I found ${request.chunks.length} relevant sections in your documents.`;
    const evidence = request.chunks
      .slice(0, 3)
      .map((chunk, index) => `[${index + 1}] ${compactSnippet(chunk.text, 280)}`)
      .join('\n\n');

    return `${leadIn}\n\n${evidence}`;
  }
}

function buildPrompt(request: GenerateNotebookAnswerRequest) {
  const context = request.chunks
    .map(
      (chunk, index) =>
        `[${index + 1}] ${chunk.documentName}, section ${chunk.chunkIndex + 1}\n${chunk.text}`,
    )
    .join('\n\n---\n\n');

  return [
    'You answer questions using only the provided document context.',
    'Be concise. If the context is insufficient, say what is missing.',
    'Reference evidence with bracketed citation numbers such as [1].',
    '',
    `Question: ${request.question}`,
    '',
    'Document context:',
    context,
  ].join('\n');
}

function stringifyMessageContent(content: unknown) {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    const text = content
      .map((part) => {
        if (typeof part === 'string') {
          return part;
        }

        if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
          return part.text;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');

    return text || 'The model returned an empty response.';
  }

  return 'The model returned an empty response.';
}

function compactSnippet(text: string, maxLength: number) {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  return singleLine.length <= maxLength ? singleLine : `${singleLine.slice(0, maxLength - 3)}...`;
}
