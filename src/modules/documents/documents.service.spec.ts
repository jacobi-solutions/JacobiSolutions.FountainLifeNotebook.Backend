import { DocumentsService } from './documents.service';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsRepository } from './documents.repository';

describe('DocumentsService', () => {
  it('cleans up storage, document records, and partial chunks when upload chunk persistence fails', async () => {
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
    const service = new DocumentsService(
      documentsRepository,
      chunksRepository,
      storageService,
      { extractText: jest.fn(async () => 'hello world') } as unknown as DocumentTextExtractorService,
      { splitText: jest.fn(async () => ['hello world']) } as unknown as DocumentChunkingService,
    );

    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.from('hello world'),
          mimetype: 'text/plain',
          originalname: 'notes.txt',
          size: 11,
        } as Express.Multer.File,
        { email: 'user@example.com', subject: 'user-1', username: 'user@example.com' },
      ),
    ).rejects.toThrow('chunk insert failed');

    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkCount: 0,
        status: 'failed',
      }),
    );
    expect(chunksRepository.deleteByDocumentIdForOwner).toHaveBeenCalledWith('document-1', 'user-1');
    expect(documentsRepository.deleteByIdForOwner).toHaveBeenCalledWith('document-1', 'user-1');
    expect(storageService.deleteDocument).toHaveBeenCalledWith('user-1/document-1.txt');
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
      {} as unknown as DocumentTextExtractorService,
      {} as unknown as DocumentChunkingService,
    );

    await expect(
      service.deleteDocument('document-1', {
        email: 'user@example.com',
        subject: 'user-1',
        username: 'user@example.com',
      }),
    ).resolves.toEqual({ deleted: true });

    expect(order).toEqual(['storage', 'chunks', 'document']);
  });
});
