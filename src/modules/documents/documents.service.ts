import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentDto } from './dto/document.dto';
import { DocumentsRepository } from './documents.repository';
import { DocumentRecord, DocumentRecordDocument } from './schemas/document-record.schema';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly chunksRepository: DocumentChunksRepository,
    private readonly storageService: DocumentStorageService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly chunkingService: DocumentChunkingService,
  ) {}

  async uploadDocument(file: Express.Multer.File | undefined, user: AuthenticatedUser): Promise<DocumentDto> {
    if (!file) {
      throw new BadRequestException('A document file is required.');
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new BadRequestException('Documents must be 20 MB or smaller.');
    }

    const storedDocument = await this.storageService.storeDocument({
      body: file.buffer,
      contentType: file.mimetype,
      originalFileName: file.originalname,
      ownerUserId: user.subject,
    });

    try {
      const text = await this.textExtractor.extractText(file.buffer, file.originalname, file.mimetype);
      const chunks = await this.chunkingService.splitText(text);
      const document = await this.documentsRepository.create({
        byteSize: file.size,
        chunkCount: chunks.length,
        contentType: file.mimetype,
        originalFileName: file.originalname,
        ownerUserId: user.subject,
        status: 'ready',
        storageKey: storedDocument.storageKey,
        textPreview: createTextPreview(text),
      });

      await this.chunksRepository.createMany(
        chunks.map((chunkText, index) => ({
          chunkIndex: index,
          documentId: document.id,
          documentName: document.originalFileName,
          ownerUserId: user.subject,
          text: chunkText,
        })),
      );

      return this.toDto(document);
    } catch (error) {
      await this.storageService.deleteDocument(storedDocument.storageKey);
      throw error;
    }
  }

  async listDocuments(user: AuthenticatedUser): Promise<DocumentDto[]> {
    return (await this.documentsRepository.findByOwner(user.subject)).map((document) => this.toDto(document));
  }

  async deleteDocument(documentId: string, user: AuthenticatedUser) {
    const document = await this.documentsRepository.findByIdForOwner(documentId, user.subject);
    if (!document) {
      throw new NotFoundException('Document was not found.');
    }

    await this.chunksRepository.deleteByDocumentIdForOwner(documentId, user.subject);
    const deleted = await this.documentsRepository.deleteByIdForOwner(documentId, user.subject);
    await this.storageService.deleteDocument(document.storageKey);

    return { deleted };
  }

  toDto(document: DocumentRecord | DocumentRecordDocument): DocumentDto {
    return {
      byteSize: document.byteSize,
      chunkCount: document.chunkCount,
      contentType: document.contentType,
      createdDateUtc: document.createdDateUtc,
      id: document.id,
      lastUpdatedDateUtc: document.lastUpdatedDateUtc,
      originalFileName: document.originalFileName,
      status: document.status,
      textPreview: document.textPreview,
    };
  }
}

function createTextPreview(text: string) {
  return text.length <= 320 ? text : `${text.slice(0, 317)}...`;
}
