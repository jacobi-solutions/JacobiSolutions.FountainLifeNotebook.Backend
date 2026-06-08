import {
  DeleteKnowledgeBaseDocumentsCommand,
  GetKnowledgeBaseDocumentsCommand,
  IngestKnowledgeBaseDocumentsCommand,
  BedrockAgentClient,
} from '@aws-sdk/client-bedrock-agent';
import {
  BedrockAgentRuntimeClient,
  RetrieveAndGenerateCommand,
  type RetrievalFilter,
} from '@aws-sdk/client-bedrock-agent-runtime';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  AwsConfig,
  LlmConfig,
  RetrievalConfig,
} from '../../shared/config/app.config';
import { Citation } from '../assistants/data-contracts/citation';

export interface KnowledgeBaseDocumentMetadata {
  documentId: string;
  notebookId: string;
  ownerUserId: string;
}

export interface IngestKnowledgeBaseDocumentRequest extends KnowledgeBaseDocumentMetadata {
  contentType: string;
  metadataStorageUri?: string;
  originalFileName: string;
  storageUri?: string;
  text?: string;
}

export interface KnowledgeBaseDocumentStatus {
  status?: string;
  statusReason?: string;
}

export interface KnowledgeBaseAnswer {
  answer: string;
  citations: Citation[];
}

@Injectable()
export class KnowledgeBaseService {
  private readonly agentClient?: BedrockAgentClient;
  private readonly runtimeClient?: BedrockAgentRuntimeClient;
  private readonly awsConfig: AwsConfig;
  private readonly llmConfig: LlmConfig;
  private readonly logger = new Logger(KnowledgeBaseService.name);
  private readonly retrievalConfig: RetrievalConfig;

  constructor(configService: ConfigService) {
    this.awsConfig = configService.getOrThrow<AwsConfig>('aws');
    this.llmConfig = configService.getOrThrow<LlmConfig>('llm');
    this.retrievalConfig =
      configService.getOrThrow<RetrievalConfig>('retrieval');

    if (this.retrievalConfig.retrievalProvider === 'bedrock-kb') {
      this.agentClient = new BedrockAgentClient({
        region: this.awsConfig.region,
      });
      this.runtimeClient = new BedrockAgentRuntimeClient({
        region: this.awsConfig.region,
      });
    }
  }

  get isBedrockKnowledgeBaseEnabled() {
    return this.retrievalConfig.retrievalProvider === 'bedrock-kb';
  }

  async ingestDocument(
    request: IngestKnowledgeBaseDocumentRequest,
  ): Promise<KnowledgeBaseDocumentStatus> {
    if (!this.isBedrockKnowledgeBaseEnabled) {
      return { status: 'ready' };
    }
    if (!this.agentClient) {
      throw new Error('Bedrock Agent client is not configured.');
    }

    const response = await this.agentClient.send(
      new IngestKnowledgeBaseDocumentsCommand({
        dataSourceId: this.requireDataSourceId(),
        documents: [
          {
            content: this.createDocumentContent(request),
            metadata: this.createDocumentMetadata(request),
          },
        ],
        knowledgeBaseId: this.requireKnowledgeBaseId(),
      }),
    );

    const detail = response.documentDetails?.[0];
    return normalizeKnowledgeBaseStatus(detail?.status, detail?.statusReason);
  }

  async refreshDocumentStatus(
    metadata: KnowledgeBaseDocumentMetadata,
    storageUri?: string,
  ): Promise<KnowledgeBaseDocumentStatus | undefined> {
    if (!this.isBedrockKnowledgeBaseEnabled || !this.agentClient) {
      return undefined;
    }

    const response = await this.agentClient.send(
      new GetKnowledgeBaseDocumentsCommand({
        dataSourceId: this.requireDataSourceId(),
        documentIdentifiers: [
          this.createDocumentIdentifier(metadata.documentId, storageUri),
        ],
        knowledgeBaseId: this.requireKnowledgeBaseId(),
      }),
    );
    const detail = response.documentDetails?.[0];
    return detail
      ? normalizeKnowledgeBaseStatus(detail.status, detail.statusReason)
      : undefined;
  }

  async deleteDocument(documentId: string, storageUri?: string) {
    if (!this.isBedrockKnowledgeBaseEnabled || !this.agentClient) {
      return;
    }

    await this.agentClient.send(
      new DeleteKnowledgeBaseDocumentsCommand({
        dataSourceId: this.requireDataSourceId(),
        documentIdentifiers: [
          this.createDocumentIdentifier(documentId, storageUri),
        ],
        knowledgeBaseId: this.requireKnowledgeBaseId(),
      }),
    );
  }

  async answerQuestion(request: {
    documentIds?: string[];
    message: string;
    notebookId: string;
    ownerUserId: string;
  }): Promise<KnowledgeBaseAnswer> {
    if (!this.isBedrockKnowledgeBaseEnabled) {
      throw new Error('Bedrock Knowledge Base retrieval is not enabled.');
    }
    if (!this.runtimeClient) {
      throw new Error('Bedrock Agent Runtime client is not configured.');
    }

    try {
      const response = await this.runtimeClient.send(
        new RetrieveAndGenerateCommand({
          input: { text: request.message },
          retrieveAndGenerateConfiguration: {
            knowledgeBaseConfiguration: {
              knowledgeBaseId: this.requireKnowledgeBaseId(),
              modelArn: this.resolveKnowledgeBaseModelArn(),
              retrievalConfiguration: {
                vectorSearchConfiguration: {
                  filter: buildKnowledgeBaseFilter(request),
                  numberOfResults: 8,
                },
              },
            },
            type: 'KNOWLEDGE_BASE',
          },
        }),
      );

      return {
        answer:
          response.output?.text ??
          'The knowledge base returned an empty response.',
        citations: normalizeCitations(response.citations),
      };
    } catch (error) {
      this.logger.error({
        error: error instanceof Error ? error.message : String(error),
        event: 'bedrock_kb.retrieve_and_generate_failed',
        knowledgeBaseId: this.retrievalConfig.bedrockKnowledgeBaseId,
      });
      throw error;
    }
  }

  private createDocumentContent(request: IngestKnowledgeBaseDocumentRequest) {
    if (request.storageUri) {
      return {
        dataSourceType: 'S3' as const,
        s3: {
          s3Location: {
            uri: request.storageUri,
          },
        },
      };
    }

    if (!request.text) {
      throw new Error('Knowledge Base ingestion requires S3 URI or text.');
    }

    return {
      custom: {
        customDocumentIdentifier: {
          id: request.documentId,
        },
        inlineContent: {
          textContent: {
            data: request.text,
          },
          type: 'TEXT' as const,
        },
        sourceType: 'IN_LINE' as const,
      },
      dataSourceType: 'CUSTOM' as const,
    };
  }

  private createDocumentIdentifier(documentId: string, storageUri?: string) {
    return storageUri
      ? {
          dataSourceType: 'S3' as const,
          s3: {
            uri: storageUri,
          },
        }
      : {
          custom: { id: documentId },
          dataSourceType: 'CUSTOM' as const,
        };
  }

  private createDocumentMetadata(request: IngestKnowledgeBaseDocumentRequest) {
    if (request.storageUri) {
      if (!request.metadataStorageUri) {
        throw new Error(
          'Knowledge Base S3 ingestion requires S3 metadata URI.',
        );
      }

      return {
        s3Location: {
          uri: request.metadataStorageUri,
        },
        type: 'S3_LOCATION' as const,
      };
    }

    return {
      inlineAttributes: [
        createStringMetadata('ownerUserId', request.ownerUserId),
        createStringMetadata('notebookId', request.notebookId),
        createStringMetadata('documentId', request.documentId),
        createStringMetadata('originalFileName', request.originalFileName),
      ],
      type: 'IN_LINE_ATTRIBUTE' as const,
    };
  }

  private requireDataSourceId() {
    if (!this.retrievalConfig.bedrockDataSourceId) {
      throw new Error(
        'Missing required configuration: BEDROCK_KNOWLEDGE_BASE_DATA_SOURCE_ID',
      );
    }

    return this.retrievalConfig.bedrockDataSourceId;
  }

  private requireKnowledgeBaseId() {
    if (!this.retrievalConfig.bedrockKnowledgeBaseId) {
      throw new Error(
        'Missing required configuration: BEDROCK_KNOWLEDGE_BASE_ID',
      );
    }

    return this.retrievalConfig.bedrockKnowledgeBaseId;
  }

  private resolveKnowledgeBaseModelArn() {
    if (this.retrievalConfig.bedrockKnowledgeBaseModelArn) {
      return this.retrievalConfig.bedrockKnowledgeBaseModelArn;
    }
    if (!this.llmConfig.bedrockModelId) {
      throw new Error('Missing required configuration: BEDROCK_MODEL_ID');
    }

    return `arn:aws:bedrock:${this.awsConfig.region}::foundation-model/${this.llmConfig.bedrockModelId}`;
  }
}

function createStringMetadata(key: string, value: string) {
  return {
    key,
    value: {
      stringValue: value,
      type: 'STRING' as const,
    },
  };
}

function normalizeKnowledgeBaseStatus(
  status: string | undefined,
  statusReason: string | undefined,
): KnowledgeBaseDocumentStatus {
  const normalizedStatus = status?.toUpperCase();

  return {
    status:
      normalizedStatus === 'INDEXED'
        ? 'ready'
        : normalizedStatus === 'FAILED'
          ? 'failed'
          : 'processing',
    statusReason,
  };
}

function buildKnowledgeBaseFilter(request: {
  documentIds?: string[];
  notebookId: string;
}): RetrievalFilter {
  const documentIds = Array.from(
    new Set(
      (request.documentIds ?? [])
        .map((documentId) => documentId.trim())
        .filter(Boolean),
    ),
  );
  const filters: RetrievalFilter[] = [
    {
      equals: {
        key: 'notebookId',
        value: request.notebookId,
      },
    },
  ];

  if (documentIds.length > 0) {
    filters.push({
      orAll: documentIds.map(
        (documentId): RetrievalFilter => ({
          equals: {
            key: 'documentId',
            value: documentId,
          },
        }),
      ),
    });
  }

  return { andAll: filters };
}

function normalizeCitations(citations: unknown): Citation[] {
  if (!Array.isArray(citations)) {
    return [];
  }

  const normalizedCitations: Citation[] = [];
  for (const citation of citations) {
    if (typeof citation !== 'object' || citation === null) {
      continue;
    }

    const retrievedReferences =
      'retrievedReferences' in citation
        ? citation.retrievedReferences
        : undefined;
    if (!Array.isArray(retrievedReferences)) {
      continue;
    }

    for (const reference of retrievedReferences) {
      normalizedCitations.push(
        normalizeReferenceCitation(reference, normalizedCitations.length),
      );
    }
  }

  return normalizedCitations;
}

function normalizeReferenceCitation(
  reference: unknown,
  index: number,
): Citation {
  const value =
    typeof reference === 'object' && reference !== null
      ? (reference as Record<string, unknown>)
      : {};
  const metadata =
    typeof value.metadata === 'object' && value.metadata !== null
      ? (value.metadata as Record<string, unknown>)
      : {};
  const content =
    typeof value.content === 'object' && value.content !== null
      ? (value.content as Record<string, unknown>)
      : {};
  const text = typeof content.text === 'string' ? content.text : '';

  return {
    chunkIndex: index,
    documentId:
      typeof metadata.documentId === 'string'
        ? metadata.documentId
        : `knowledge-base-source-${index + 1}`,
    documentName:
      typeof metadata.originalFileName === 'string'
        ? metadata.originalFileName
        : 'Knowledge base source',
    snippet: createCitationSnippet(text),
  };
}

function createCitationSnippet(text: string) {
  const singleLine = text.replace(/\s+/g, ' ').trim();
  return singleLine.length <= 240
    ? singleLine
    : `${singleLine.slice(0, 237)}...`;
}
