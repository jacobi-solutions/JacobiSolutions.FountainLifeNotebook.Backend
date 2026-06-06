import { BadRequestException, Injectable, Logger } from '@nestjs/common';
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
  ) {}

  async uploadDocument(
    file: Express.Multer.File | undefined,
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
      originalFileName: file.originalname,
      ownerUserId: user.subject,
    });

    let document: DocumentRecordDocument | undefined;

    try {
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
        user.subject,
      );
      throw error;
    }
  }

  private async cleanupFailedUpload(
    storageKey: string,
    document: DocumentRecordDocument | undefined,
    ownerUserId: string,
  ) {
    const cleanupTasks: Promise<unknown>[] = [
      this.storageService.deleteDocument(storageKey),
    ];

    if (document) {
      cleanupTasks.push(
        this.chunksRepository.deleteByDocumentIdForOwner(
          document.id,
          ownerUserId,
        ),
        this.documentsRepository.deleteByIdForOwner(document.id, ownerUserId),
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
