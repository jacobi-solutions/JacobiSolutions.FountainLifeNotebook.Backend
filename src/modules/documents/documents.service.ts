import {
  Inject,
  forwardRef,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { NotebooksService } from '../notebooks/notebooks.service';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentIngestionService } from './document-ingestion.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentDetail } from './data-contracts/document-detail';
import { DocumentSummary } from './data-contracts/document-summary';
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
    private readonly knowledgeBaseService: KnowledgeBaseService,
    @Inject(forwardRef(() => NotebooksService))
    private readonly notebooksService: NotebooksService,
  ) {}

  async uploadDocument(
    file: Express.Multer.File | undefined,
    notebookId: string,
    user: AuthenticatedUser,
  ): Promise<DocumentSummary> {
    await this.notebooksService.assertNotebookWriteAccess(notebookId, user);

    return await this.toSummary(
      await this.documentIngestionService.uploadDocument(file, notebookId, user),
    );
  }

  async listDocuments(
    notebookId: string,
    user: AuthenticatedUser,
  ): Promise<DocumentSummary[]> {
    await this.notebooksService.assertNotebookAccess(notebookId, user);
    const documents = await this.documentsRepository.findByNotebook(notebookId);

    return Promise.all(
      documents.map((document) => this.toSummary(document, { refreshStatus: false })),
    );
  }

  async viewDocument(
    documentId: string,
    notebookId: string,
    user: AuthenticatedUser,
  ): Promise<DocumentDetail> {
    await this.notebooksService.assertNotebookAccess(notebookId, user);
    const document = await this.documentsRepository.findByIdForNotebook(
      documentId,
      notebookId,
    );
    if (!document) {
      throw new NotFoundException('Document was not found.');
    }

    const chunks = await this.chunksRepository.findByNotebookAndDocumentId(
      notebookId,
      documentId,
    );

    return {
      ...(await this.toSummary(document)),
      chunks: chunks.map((chunk) => ({
        chunkIndex: chunk.chunkIndex,
        text: chunk.text,
      })),
    };
  }

  async deleteDocument(
    documentId: string,
    notebookId: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    await this.notebooksService.assertNotebookDocumentManageAccess(
      notebookId,
      user,
    );
    const document = await this.documentsRepository.findByIdForNotebook(
      documentId,
      notebookId,
    );
    if (!document) {
      throw new NotFoundException('Document was not found.');
    }

    await this.deleteDocumentRecord(document);
  }

  async deleteNotebookDocuments(notebookId: string, user: AuthenticatedUser) {
    await this.notebooksService.assertNotebookDocumentManageAccess(
      notebookId,
      user,
    );
    const documents = await this.documentsRepository.findByNotebook(notebookId);

    for (const document of documents) {
      await this.deleteDocumentRecord(document);
    }
  }

  async countDocumentsByNotebook(
    _ownerUserId: string,
    notebookIds: string[],
  ): Promise<Record<string, number>> {
    if (notebookIds.length === 0) {
      return {};
    }

    const counts = await this.documentsRepository.findByNotebookIds(notebookIds);

    return Object.fromEntries(counts.map((count) => [count._id, count.count]));
  }

  private async deleteDocumentRecord(
    document: DocumentRecord | DocumentRecordDocument,
  ) {
    await this.knowledgeBaseService.deleteDocument(document.id, document.storageUri);
    await this.storageService.deleteDocument(document.storageKey);
    await this.chunksRepository.deleteByDocumentIdForNotebook(
      document.id,
      document.notebookId,
    );
    await this.documentsRepository.deleteByIdForNotebook(
      document.id,
      document.notebookId,
    );
  }

  async toSummary(
    document: DocumentRecord | DocumentRecordDocument,
    options: { refreshStatus?: boolean } = {},
  ): Promise<DocumentSummary> {
    const currentDocument =
      options.refreshStatus === false
        ? document
        : await this.refreshKnowledgeBaseStatus(document);

    return {
      byteSize: currentDocument.byteSize,
      chunkCount: currentDocument.chunkCount,
      contentType: currentDocument.contentType,
      createdDateUtc: currentDocument.createdDateUtc,
      id: currentDocument.id,
      knowledgeBaseStatusReason: currentDocument.knowledgeBaseStatusReason,
      lastUpdatedDateUtc: currentDocument.lastUpdatedDateUtc,
      notebookId: currentDocument.notebookId,
      originalFileName: currentDocument.originalFileName,
      status: currentDocument.status,
      textPreview: currentDocument.textPreview,
    };
  }

  private async refreshKnowledgeBaseStatus(
    document: DocumentRecord | DocumentRecordDocument,
  ) {
    if (document.status !== 'processing') {
      return document;
    }

    const status = await this.knowledgeBaseService.refreshDocumentStatus(
      {
        documentId: document.id,
        notebookId: document.notebookId,
        ownerUserId: document.ownerUserId,
      },
      document.storageUri,
    );
    if (!status?.status || status.status === document.status) {
      return document;
    }

    return (
      (await this.documentsRepository.updateById(document.id, {
        $set: {
          knowledgeBaseStatusReason: status.statusReason,
          status: status.status,
        },
      })) ?? document
    );
  }
}
