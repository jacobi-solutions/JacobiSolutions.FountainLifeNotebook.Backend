import { BadRequestException } from '@nestjs/common';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentIngestionService } from './document-ingestion.service';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document.constants';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsRepository } from './documents.repository';

describe('DocumentIngestionService', () => {
  it('stores, extracts, chunks, and marks uploaded documents ready', async () => {
    const createdDocument = {
      byteSize: 18,
      chunkCount: 0,
      contentType: 'text/plain',
      createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      id: 'document-1',
      lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
      status: 'failed',
      storageKey: 'user-1/document-1.txt',
      textPreview: 'First chunk Second',
    };
    const readyDocument = {
      ...createdDocument,
      chunkCount: 2,
      status: 'ready',
    };
    const documentsRepository = {
      create: jest.fn(async () => createdDocument),
      updateById: jest.fn(async () => readyDocument),
    } as unknown as DocumentsRepository;
    const chunksRepository = {
      createMany: jest.fn(async () => undefined),
    } as unknown as DocumentChunksRepository;
    const storageService = {
      deleteDocument: jest.fn(async () => undefined),
      storeDocument: jest.fn(async () => ({
        storageKey: createdDocument.storageKey,
      })),
    } as unknown as DocumentStorageService;
    const service = new DocumentIngestionService(
      documentsRepository,
      chunksRepository,
      storageService,
      {
        extractText: jest.fn(async () => 'First chunk Second chunk'),
      } as unknown as DocumentTextExtractorService,
      {
        splitText: jest.fn(async () => ['First chunk', 'Second chunk']),
      } as unknown as DocumentChunkingService,
    );

    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.from('First chunk Second'),
          mimetype: 'text/plain',
          originalname: 'notes.txt',
          size: 18,
        } as Express.Multer.File,
        {
          email: 'user@example.com',
          subject: 'user-1',
          username: 'user@example.com',
        },
      ),
    ).resolves.toBe(readyDocument);

    expect(storageService.storeDocument).toHaveBeenCalledWith({
      body: Buffer.from('First chunk Second'),
      contentType: 'text/plain',
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
    });
    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkCount: 0,
        status: 'failed',
        storageKey: 'user-1/document-1.txt',
      }),
    );
    expect(chunksRepository.createMany).toHaveBeenCalledWith([
      {
        chunkIndex: 0,
        documentId: 'document-1',
        documentName: 'notes.txt',
        ownerUserId: 'user-1',
        text: 'First chunk',
      },
      {
        chunkIndex: 1,
        documentId: 'document-1',
        documentName: 'notes.txt',
        ownerUserId: 'user-1',
        text: 'Second chunk',
      },
    ]);
    expect(documentsRepository.updateById).toHaveBeenCalledWith('document-1', {
      $set: {
        chunkCount: 2,
        status: 'ready',
      },
    });
    expect(storageService.deleteDocument).not.toHaveBeenCalled();
  });

  it('cleans up storage, document records, and partial chunks when chunk persistence fails', async () => {
    const document = {
      byteSize: 11,
      chunkCount: 0,
      contentType: 'text/plain',
      createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      id: 'document-1',
      lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
      status: 'failed',
      storageKey: 'user-1/document-1.txt',
      textPreview: 'hello world',
    };
    const documentsRepository = {
      create: jest.fn(async () => document),
      deleteByIdForOwner: jest.fn(async () => true),
    } as unknown as DocumentsRepository;
    const chunksRepository = {
      createMany: jest.fn(async () => {
        throw new Error('chunk insert failed');
      }),
      deleteByDocumentIdForOwner: jest.fn(async () => undefined),
    } as unknown as DocumentChunksRepository;
    const storageService = {
      deleteDocument: jest.fn(async () => undefined),
      storeDocument: jest.fn(async () => ({ storageKey: document.storageKey })),
    } as unknown as DocumentStorageService;
    const service = new DocumentIngestionService(
      documentsRepository,
      chunksRepository,
      storageService,
      {
        extractText: jest.fn(async () => 'hello world'),
      } as unknown as DocumentTextExtractorService,
      {
        splitText: jest.fn(async () => ['hello world']),
      } as unknown as DocumentChunkingService,
    );

    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.from('hello world'),
          mimetype: 'text/plain',
          originalname: 'notes.txt',
          size: 11,
        } as Express.Multer.File,
        {
          email: 'user@example.com',
          subject: 'user-1',
          username: 'user@example.com',
        },
      ),
    ).rejects.toThrow('chunk insert failed');

    expect(chunksRepository.deleteByDocumentIdForOwner).toHaveBeenCalledWith(
      'document-1',
      'user-1',
    );
    expect(documentsRepository.deleteByIdForOwner).toHaveBeenCalledWith(
      'document-1',
      'user-1',
    );
    expect(storageService.deleteDocument).toHaveBeenCalledWith(
      'user-1/document-1.txt',
    );
  });

  it('rejects missing and oversized files before storage work starts', async () => {
    const storageService = {
      storeDocument: jest.fn(),
    } as unknown as DocumentStorageService;
    const service = new DocumentIngestionService(
      {} as DocumentsRepository,
      {} as DocumentChunksRepository,
      storageService,
      {} as DocumentTextExtractorService,
      {} as DocumentChunkingService,
    );
    const user = {
      email: 'user@example.com',
      subject: 'user-1',
      username: 'user@example.com',
    };

    await expect(
      service.uploadDocument(undefined, user),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.alloc(0),
          mimetype: 'text/plain',
          originalname: 'too-large.txt',
          size: MAX_DOCUMENT_UPLOAD_BYTES + 1,
        } as Express.Multer.File,
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storageService.storeDocument).not.toHaveBeenCalled();
  });
});
