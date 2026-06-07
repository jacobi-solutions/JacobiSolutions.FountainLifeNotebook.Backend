import { NotFoundException } from '@nestjs/common';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { NotebooksService } from '../notebooks/notebooks.service';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentIngestionService } from './document-ingestion.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('delegates notebook-scoped uploads to the ingestion workflow and maps the response DTO', async () => {
    const document = createDocument();
    const documentIngestionService = {
      uploadDocument: jest.fn(async () => document),
    } as unknown as DocumentIngestionService;
    const notebooksService = {
      assertNotebookWriteAccess: jest.fn(async () => undefined),
    } as unknown as NotebooksService;
    const service = createService({
      documentIngestionService,
      notebooksService,
    });
    const file = {
      buffer: Buffer.from('hello world'),
      mimetype: 'text/plain',
      originalname: 'notes.txt',
      size: 11,
    } as Express.Multer.File;

    await expect(service.uploadDocument(file, 'notebook-1', user)).resolves.toEqual({
      byteSize: 11,
      chunkCount: 1,
      contentType: 'text/plain',
      createdDateUtc: document.createdDateUtc,
      id: 'document-1',
      lastUpdatedDateUtc: document.lastUpdatedDateUtc,
      notebookId: 'notebook-1',
      originalFileName: 'notes.txt',
      status: 'ready',
      textPreview: 'hello world',
    });

    expect(notebooksService.assertNotebookWriteAccess).toHaveBeenCalledWith(
      'notebook-1',
      user,
    );
    expect(documentIngestionService.uploadDocument).toHaveBeenCalledWith(
      file,
      'notebook-1',
      user,
    );
  });

  it('deletes knowledge base, storage, chunks, and Mongo state for the notebook document', async () => {
    const order: string[] = [];
    const document = createDocument();
    const service = createService({
      chunksRepository: {
        deleteByDocumentIdForNotebook: jest.fn(async () => {
          order.push('chunks');
        }),
      } as unknown as DocumentChunksRepository,
      documentsRepository: {
        deleteByIdForNotebook: jest.fn(async () => {
          order.push('document');
          return true;
        }),
        findByIdForNotebook: jest.fn(async () => document),
      } as unknown as DocumentsRepository,
      knowledgeBaseService: {
        deleteDocument: jest.fn(async () => {
          order.push('knowledge-base');
        }),
        refreshDocumentStatus: jest.fn(),
      } as unknown as KnowledgeBaseService,
      storageService: {
        deleteDocument: jest.fn(async () => {
          order.push('storage');
        }),
      } as unknown as DocumentStorageService,
      notebooksService: {
        assertNotebookDocumentManageAccess: jest.fn(async () => undefined),
      } as unknown as NotebooksService,
    });

    await expect(
      service.deleteDocument('document-1', 'notebook-1', user),
    ).resolves.toBeUndefined();

    expect(order).toEqual(['knowledge-base', 'storage', 'chunks', 'document']);
  });

  it('returns document content sections in chunk order for the current notebook', async () => {
    const document = createDocument({ chunkCount: 2 });
    const chunks = [
      { chunkIndex: 0, text: 'First section' },
      { chunkIndex: 1, text: 'Second section' },
    ];
    const documentsRepository = {
      findByIdForNotebook: jest.fn(async () => document),
    };
    const chunksRepository = {
      findByNotebookAndDocumentId: jest.fn(async () => chunks),
    };
    const service = createService({
      chunksRepository: chunksRepository as unknown as DocumentChunksRepository,
      documentsRepository: documentsRepository as unknown as DocumentsRepository,
    });

    await expect(
      service.viewDocument('document-1', 'notebook-1', user),
    ).resolves.toEqual({
      byteSize: 11,
      chunkCount: 2,
      chunks,
      contentType: 'text/plain',
      createdDateUtc: document.createdDateUtc,
      id: 'document-1',
      lastUpdatedDateUtc: document.lastUpdatedDateUtc,
      notebookId: 'notebook-1',
      originalFileName: 'notes.txt',
      status: 'ready',
      textPreview: 'hello world',
    });

    expect(documentsRepository.findByIdForNotebook).toHaveBeenCalledWith(
      'document-1',
      'notebook-1',
    );
    expect(chunksRepository.findByNotebookAndDocumentId).toHaveBeenCalledWith(
      'notebook-1',
      'document-1',
    );
  });

  it('throws when viewing a document that does not belong to the current notebook', async () => {
    const chunksRepository = {
      findByNotebookAndDocumentId: jest.fn(),
    };
    const service = createService({
      chunksRepository: chunksRepository as unknown as DocumentChunksRepository,
      documentsRepository: {
        findByIdForNotebook: jest.fn(async () => undefined),
      } as unknown as DocumentsRepository,
    });

    await expect(
      service.viewDocument('document-1', 'notebook-1', user),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(chunksRepository.findByNotebookAndDocumentId).not.toHaveBeenCalled();
  });
});

const user = {
  email: 'user@example.com',
  subject: 'user-1',
  username: 'user@example.com',
};

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    byteSize: 11,
    chunkCount: 1,
    contentType: 'text/plain',
    createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    id: 'document-1',
    lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    notebookId: 'notebook-1',
    originalFileName: 'notes.txt',
    ownerUserId: 'user-1',
    status: 'ready',
    storageKey: 'user-1/notebook-1/document-1.txt',
    textPreview: 'hello world',
    ...overrides,
  };
}

function createService(overrides: {
  chunksRepository?: DocumentChunksRepository;
  documentIngestionService?: DocumentIngestionService;
  documentsRepository?: DocumentsRepository;
  knowledgeBaseService?: KnowledgeBaseService;
  notebooksService?: NotebooksService;
  storageService?: DocumentStorageService;
} = {}) {
  return new DocumentsService(
    overrides.documentsRepository ??
      ({
        findByIdForNotebook: jest.fn(),
      } as unknown as DocumentsRepository),
    overrides.chunksRepository ??
      ({
        findByNotebookAndDocumentId: jest.fn(),
      } as unknown as DocumentChunksRepository),
    overrides.storageService ??
      ({
        deleteDocument: jest.fn(),
      } as unknown as DocumentStorageService),
    overrides.documentIngestionService ??
      ({
        uploadDocument: jest.fn(),
      } as unknown as DocumentIngestionService),
    overrides.knowledgeBaseService ??
      ({
        deleteDocument: jest.fn(),
        refreshDocumentStatus: jest.fn(),
      } as unknown as KnowledgeBaseService),
    overrides.notebooksService ??
      ({
        assertNotebookAccess: jest.fn(async () => undefined),
        assertNotebookDocumentManageAccess: jest.fn(async () => undefined),
        assertNotebookWriteAccess: jest.fn(async () => undefined),
      } as unknown as NotebooksService),
  );
}
