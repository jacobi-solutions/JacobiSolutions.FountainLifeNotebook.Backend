import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentIngestionService } from './document-ingestion.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { NotFoundException } from '@nestjs/common';

describe('DocumentsService', () => {
  it('delegates uploads to the ingestion workflow and maps the response DTO', async () => {
    const document = {
      byteSize: 11,
      chunkCount: 1,
      contentType: 'text/plain',
      createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      id: 'document-1',
      lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
      status: 'ready',
      storageKey: 'user-1/document-1.txt',
      textPreview: 'hello world',
    };
    const documentIngestionService = {
      uploadDocument: jest.fn(async () => document),
    } as unknown as DocumentIngestionService;
    const service = new DocumentsService(
      {} as unknown as DocumentsRepository,
      {} as unknown as DocumentChunksRepository,
      {} as unknown as DocumentStorageService,
      documentIngestionService,
    );
    const file = {
      buffer: Buffer.from('hello world'),
      mimetype: 'text/plain',
      originalname: 'notes.txt',
      size: 11,
    } as Express.Multer.File;
    const user = {
      email: 'user@example.com',
      subject: 'user-1',
      username: 'user@example.com',
    };

    await expect(service.uploadDocument(file, user)).resolves.toEqual({
      byteSize: 11,
      chunkCount: 1,
      contentType: 'text/plain',
      createdDateUtc: document.createdDateUtc,
      id: 'document-1',
      lastUpdatedDateUtc: document.lastUpdatedDateUtc,
      originalFileName: 'notes.txt',
      status: 'ready',
      textPreview: 'hello world',
    });

    expect(documentIngestionService.uploadDocument).toHaveBeenCalledWith(
      file,
      user,
    );
  });

  it('deletes storage before Mongo state so failed storage deletion can be retried', async () => {
    const order: string[] = [];
    const document = {
      id: 'document-1',
      storageKey: 'user-1/document-1.txt',
    };
    const service = new DocumentsService(
      {
        deleteByIdForOwner: jest.fn(async () => {
          order.push('document');
          return true;
        }),
        findByIdForOwner: jest.fn(async () => document),
      } as unknown as DocumentsRepository,
      {
        deleteByDocumentIdForOwner: jest.fn(async () => {
          order.push('chunks');
        }),
      } as unknown as DocumentChunksRepository,
      {
        deleteDocument: jest.fn(async () => {
          order.push('storage');
        }),
      } as unknown as DocumentStorageService,
      {} as unknown as DocumentIngestionService,
    );

    await expect(
      service.deleteDocument('document-1', {
        email: 'user@example.com',
        subject: 'user-1',
        username: 'user@example.com',
      }),
    ).resolves.toBeUndefined();

    expect(order).toEqual(['storage', 'chunks', 'document']);
  });

  it('returns document content sections in chunk order for the current owner', async () => {
    const document = {
      byteSize: 11,
      chunkCount: 2,
      contentType: 'text/plain',
      createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      id: 'document-1',
      lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
      status: 'ready',
      storageKey: 'user-1/document-1.txt',
      textPreview: 'hello world',
    };
    const chunks = [
      { chunkIndex: 0, text: 'First section' },
      { chunkIndex: 1, text: 'Second section' },
    ];
    const documentsRepository = {
      findByIdForOwner: jest.fn(async () => document),
    };
    const chunksRepository = {
      findByOwnerAndDocumentId: jest.fn(async () => chunks),
    };
    const service = new DocumentsService(
      documentsRepository as unknown as DocumentsRepository,
      chunksRepository as unknown as DocumentChunksRepository,
      {} as unknown as DocumentStorageService,
      {} as unknown as DocumentIngestionService,
    );

    await expect(
      service.viewDocument('document-1', {
        email: 'user@example.com',
        subject: 'user-1',
        username: 'user@example.com',
      }),
    ).resolves.toEqual({
      byteSize: 11,
      chunkCount: 2,
      chunks,
      contentType: 'text/plain',
      createdDateUtc: document.createdDateUtc,
      id: 'document-1',
      lastUpdatedDateUtc: document.lastUpdatedDateUtc,
      originalFileName: 'notes.txt',
      status: 'ready',
      textPreview: 'hello world',
    });

    expect(documentsRepository.findByIdForOwner).toHaveBeenCalledWith(
      'document-1',
      'user-1',
    );
    expect(chunksRepository.findByOwnerAndDocumentId).toHaveBeenCalledWith(
      'user-1',
      'document-1',
    );
  });

  it('throws when viewing a document that does not belong to the current owner', async () => {
    const chunksRepository = {
      findByOwnerAndDocumentId: jest.fn(),
    };
    const service = new DocumentsService(
      {
        findByIdForOwner: jest.fn(async () => undefined),
      } as unknown as DocumentsRepository,
      chunksRepository as unknown as DocumentChunksRepository,
      {} as unknown as DocumentStorageService,
      {} as unknown as DocumentIngestionService,
    );

    await expect(
      service.viewDocument('document-1', {
        email: 'user@example.com',
        subject: 'user-1',
        username: 'user@example.com',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(chunksRepository.findByOwnerAndDocumentId).not.toHaveBeenCalled();
  });
});
