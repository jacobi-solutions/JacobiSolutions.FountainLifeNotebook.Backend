import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import {
  DOCUMENT_TEXT_PREVIEW_LENGTH,
  MAX_DOCUMENT_UPLOAD_BYTES,
} from './document.constants';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentRecordDocument } from './schemas/document-record.schema';

@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);

  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly chunksRepository: DocumentChunksRepository,
    private readonly storageService: DocumentStorageService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly chunkingService: DocumentChunkingService,
    private readonly knowledgeBaseService: KnowledgeBaseService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File | undefined,
    notebookId: string,
    user: AuthenticatedUser,
  ) {
    if (!file) {
      throw new BadRequestException('A document file is required.');
    }

    if (file.size > MAX_DOCUMENT_UPLOAD_BYTES) {
      throw new BadRequestException('Documents must be 20 MB or smaller.');
    }

    const storedDocument = await this.storageService.storeDocument({
      body: file.buffer,
      contentType: file.mimetype,
      notebookId,
      originalFileName: file.originalname,
      ownerUserId: user.subject,
    });

    let document: DocumentRecordDocument | undefined;

    try {
      if (this.knowledgeBaseService.isBedrockKnowledgeBaseEnabled) {
        const createdDocument = await this.documentsRepository.create({
          byteSize: file.size,
          chunkCount: 0,
          contentType: file.mimetype,
          notebookId,
          originalFileName: file.originalname,
          ownerUserId: user.subject,
          status: 'processing',
          storageKey: storedDocument.storageKey,
          storageUri: storedDocument.storageUri,
        });
        document = createdDocument;

        const fallbackText = storedDocument.storageUri
          ? undefined
          : await this.textExtractor.extractText(
              file.buffer,
              file.originalname,
              file.mimetype,
            );
        const storedMetadata = storedDocument.storageUri
          ? await this.storageService.storeDocumentMetadata({
              body: createBedrockMetadataFile({
                documentId: createdDocument.id,
                notebookId,
                originalFileName: file.originalname,
                ownerUserId: user.subject,
              }),
              contentType: 'application/json',
              storageKey: storedDocument.storageKey,
            })
          : undefined;
        const status = await this.knowledgeBaseService.ingestDocument({
          contentType: file.mimetype,
          documentId: createdDocument.id,
          metadataStorageUri: storedMetadata?.storageUri,
          notebookId,
          originalFileName: file.originalname,
          ownerUserId: user.subject,
          storageUri: storedDocument.storageUri,
          text: fallbackText,
        });

        const readyDocument = await this.documentsRepository.updateById(
          createdDocument.id,
          {
            $set: {
              knowledgeBaseStatusReason: status.statusReason,
              status: status.status ?? 'processing',
            },
          },
        );
        if (!readyDocument) {
          throw new Error('Document was not found after upload.');
        }

        return readyDocument;
      }

      const text = await this.textExtractor.extractText(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      const chunks = await this.chunkingService.splitText(text);
      const createdDocument = await this.documentsRepository.create({
        byteSize: file.size,
        chunkCount: 0,
        contentType: file.mimetype,
        notebookId,
        originalFileName: file.originalname,
        ownerUserId: user.subject,
        status: 'failed',
        storageKey: storedDocument.storageKey,
        textPreview: createTextPreview(text),
      });
      document = createdDocument;

      await this.chunksRepository.createMany(
        chunks.map((chunkText, index) => ({
          chunkIndex: index,
          documentId: createdDocument.id,
          documentName: createdDocument.originalFileName,
          notebookId,
          ownerUserId: user.subject,
          text: chunkText,
        })),
      );

      const readyDocument = await this.documentsRepository.updateById(
        createdDocument.id,
        {
          $set: {
            chunkCount: chunks.length,
            status: 'ready',
          },
        },
      );
      if (!readyDocument) {
        throw new Error('Document was not found after upload.');
      }

      return readyDocument;
    } catch (error) {
      await this.cleanupFailedUpload(
        storedDocument.storageKey,
        document,
        notebookId,
      );
      throw error;
    }
  }

  private async cleanupFailedUpload(
    storageKey: string,
    document: DocumentRecordDocument | undefined,
    notebookId: string,
  ) {
    const cleanupTasks: Promise<unknown>[] = [
      this.storageService.deleteDocument(storageKey),
    ];

    if (document) {
      cleanupTasks.push(
        this.knowledgeBaseService.deleteDocument(
          document.id,
          document.storageUri,
        ),
        this.chunksRepository.deleteByDocumentIdForNotebook(
          document.id,
          notebookId,
        ),
        this.documentsRepository.deleteByIdForNotebook(document.id, notebookId),
      );
    }

    const cleanupResults = await Promise.allSettled(cleanupTasks);
    for (const result of cleanupResults) {
      if (result.status === 'rejected') {
        this.logger.warn({
          documentId: document?.id,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
          event: 'document.upload_cleanup_failed',
          storageKey,
        });
      }
    }
  }
}

function createTextPreview(text: string) {
  return text.length <= DOCUMENT_TEXT_PREVIEW_LENGTH
    ? text
    : `${text.slice(0, DOCUMENT_TEXT_PREVIEW_LENGTH - 3)}...`;
}

function createBedrockMetadataFile(metadata: {
  documentId: string;
  notebookId: string;
  originalFileName: string;
  ownerUserId: string;
}) {
  return JSON.stringify({
    metadataAttributes: {
      documentId: createBedrockStringMetadata(metadata.documentId),
      notebookId: createBedrockStringMetadata(metadata.notebookId),
      originalFileName: createBedrockStringMetadata(metadata.originalFileName),
      ownerUserId: createBedrockStringMetadata(metadata.ownerUserId),
    },
  });
}

function createBedrockStringMetadata(value: string) {
  return {
    includeForEmbedding: false,
    value: {
      stringValue: value,
      type: 'STRING',
    },
  };
}
