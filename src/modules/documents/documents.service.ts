import { Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentIngestionService } from './document-ingestion.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentDto } from './dto/document.dto';
import { DocumentsRepository } from './documents.repository';
import {
  DocumentRecord,
  DocumentRecordDocument,
} from './schemas/document-record.schema';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly chunksRepository: DocumentChunksRepository,
    private readonly storageService: DocumentStorageService,
    private readonly documentIngestionService: DocumentIngestionService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File | undefined,
    user: AuthenticatedUser,
  ): Promise<DocumentDto> {
    return this.toDto(
      await this.documentIngestionService.uploadDocument(file, user),
    );
  }

  async listDocuments(user: AuthenticatedUser): Promise<DocumentDto[]> {
    return (await this.documentsRepository.findByOwner(user.subject)).map(
      (document) => this.toDto(document),
    );
  }

  async deleteDocument(documentId: string, user: AuthenticatedUser) {
    const document = await this.documentsRepository.findByIdForOwner(
      documentId,
      user.subject,
    );
    if (!document) {
      throw new NotFoundException('Document was not found.');
    }

    await this.storageService.deleteDocument(document.storageKey);
    await this.chunksRepository.deleteByDocumentIdForOwner(
      documentId,
      user.subject,
    );
    const deleted = await this.documentsRepository.deleteByIdForOwner(
      documentId,
      user.subject,
    );

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
