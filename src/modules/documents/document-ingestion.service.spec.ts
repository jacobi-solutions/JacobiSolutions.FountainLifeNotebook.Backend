import { BadRequestException } from '@nestjs/common';
import { KnowledgeBaseService } from '../knowledge-base/knowledge-base.service';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentIngestionService } from './document-ingestion.service';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document.constants';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsRepository } from './documents.repository';

describe('DocumentIngestionService', () => {
  it('stores, extracts, chunks, and marks local uploaded documents ready', async () => {
    const createdDocument = createDocument({ status: 'failed' });
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
    const service = createService({
      chunksRepository,
      documentsRepository,
      storageService,
    });

    await expect(
      service.uploadDocument(file('First chunk Second'), 'notebook-1', user),
    ).resolves.toBe(readyDocument);

    expect(storageService.storeDocument).toHaveBeenCalledWith({
      body: Buffer.from('First chunk Second'),
      contentType: 'text/plain',
      notebookId: 'notebook-1',
      originalFileName: 'notes.txt',
      ownerUserId: 'user-1',
    });
    expect(documentsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        chunkCount: 0,
        notebookId: 'notebook-1',
        status: 'failed',
        storageKey: 'user-1/notebook-1/document-1.txt',
      }),
    );
    expect(chunksRepository.createMany).toHaveBeenCalledWith([
      {
        chunkIndex: 0,
        documentId: 'document-1',
        documentName: 'notes.txt',
        notebookId: 'notebook-1',
        ownerUserId: 'user-1',
        text: 'First chunk',
      },
      {
        chunkIndex: 1,
        documentId: 'document-1',
        documentName: 'notes.txt',
        notebookId: 'notebook-1',
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

  it('ingests production documents into Bedrock Knowledge Bases instead of local chunks', async () => {
    const createdDocument = createDocument({ status: 'processing' });
    const readyDocument = {
      ...createdDocument,
      status: 'ready',
    };
    const documentsRepository = {
      create: jest.fn(async () => createdDocument),
      updateById: jest.fn(async () => readyDocument),
    } as unknown as DocumentsRepository;
    const chunksRepository = {
      createMany: jest.fn(),
    } as unknown as DocumentChunksRepository;
    const knowledgeBaseService = {
      deleteDocument: jest.fn(),
      ingestDocument: jest.fn(async () => ({ status: 'ready' })),
      isBedrockKnowledgeBaseEnabled: true,
    } as unknown as KnowledgeBaseService;
    const textExtractor = {
      extractText: jest.fn(async () => 'Extracted text'),
    } as unknown as DocumentTextExtractorService;
    const service = createService({
      chunksRepository,
      documentsRepository,
      knowledgeBaseService,
      storageService: {
        deleteDocument: jest.fn(),
        storeDocument: jest.fn(async () => ({
          storageKey: createdDocument.storageKey,
          storageUri: 's3://documents/user-1/notebook-1/document-1.txt',
        })),
      } as unknown as DocumentStorageService,
      textExtractor,
    });

    await expect(
      service.uploadDocument(file('First chunk Second'), 'notebook-1', user),
    ).resolves.toBe(readyDocument);

    expect(chunksRepository.createMany).not.toHaveBeenCalled();
    expect(textExtractor.extractText).not.toHaveBeenCalled();
    expect(knowledgeBaseService.ingestDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        documentId: 'document-1',
        notebookId: 'notebook-1',
        ownerUserId: 'user-1',
        storageUri: 's3://documents/user-1/notebook-1/document-1.txt',
      }),
    );
  });

  it('uses extracted text for Bedrock KB inline fallback when storage has no S3 URI', async () => {
    const createdDocument = createDocument({ status: 'processing' });
    const readyDocument = {
      ...createdDocument,
      status: 'ready',
    };
    const knowledgeBaseService = {
      deleteDocument: jest.fn(),
      ingestDocument: jest.fn(async () => ({ status: 'ready' })),
      isBedrockKnowledgeBaseEnabled: true,
    } as unknown as KnowledgeBaseService;
    const textExtractor = {
      extractText: jest.fn(async () => 'Extracted source text'),
    } as unknown as DocumentTextExtractorService;
    const service = createService({
      documentsRepository: {
        create: jest.fn(async () => createdDocument),
        updateById: jest.fn(async () => readyDocument),
      } as unknown as DocumentsRepository,
      knowledgeBaseService,
      storageService: {
        deleteDocument: jest.fn(),
        storeDocument: jest.fn(async () => ({
          storageKey: createdDocument.storageKey,
        })),
      } as unknown as DocumentStorageService,
      textExtractor,
    });

    await expect(
      service.uploadDocument(file('Raw upload'), 'notebook-1', user),
    ).resolves.toBe(readyDocument);

    expect(textExtractor.extractText).toHaveBeenCalledWith(
      Buffer.from('Raw upload'),
      'notes.txt',
      'text/plain',
    );
    expect(knowledgeBaseService.ingestDocument).toHaveBeenCalledWith(
      expect.objectContaining({
        storageUri: undefined,
        text: 'Extracted source text',
      }),
    );
  });

  it('cleans up storage, KB state, document records, and partial chunks when chunk persistence fails', async () => {
    const document = createDocument({ status: 'failed' });
    const documentsRepository = {
      create: jest.fn(async () => document),
      deleteByIdForNotebook: jest.fn(async () => true),
    } as unknown as DocumentsRepository;
    const chunksRepository = {
      createMany: jest.fn(async () => {
        throw new Error('chunk insert failed');
      }),
      deleteByDocumentIdForNotebook: jest.fn(async () => undefined),
    } as unknown as DocumentChunksRepository;
    const storageService = {
      deleteDocument: jest.fn(async () => undefined),
      storeDocument: jest.fn(async () => ({ storageKey: document.storageKey })),
    } as unknown as DocumentStorageService;
    const knowledgeBaseService = {
      deleteDocument: jest.fn(async () => undefined),
      isBedrockKnowledgeBaseEnabled: false,
    } as unknown as KnowledgeBaseService;
    const service = createService({
      chunksRepository,
      documentsRepository,
      knowledgeBaseService,
      storageService,
    });

    await expect(
      service.uploadDocument(file('hello world'), 'notebook-1', user),
    ).rejects.toThrow('chunk insert failed');

    expect(chunksRepository.deleteByDocumentIdForNotebook).toHaveBeenCalledWith(
      'document-1',
      'notebook-1',
    );
    expect(documentsRepository.deleteByIdForNotebook).toHaveBeenCalledWith(
      'document-1',
      'notebook-1',
    );
    expect(storageService.deleteDocument).toHaveBeenCalledWith(
      'user-1/notebook-1/document-1.txt',
    );
  });

  it('rejects missing and oversized files before storage work starts', async () => {
    const storageService = {
      storeDocument: jest.fn(),
    } as unknown as DocumentStorageService;
    const service = createService({ storageService });

    await expect(
      service.uploadDocument(undefined, 'notebook-1', user),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.uploadDocument(
        {
          buffer: Buffer.alloc(0),
          mimetype: 'text/plain',
          originalname: 'too-large.txt',
          size: MAX_DOCUMENT_UPLOAD_BYTES + 1,
        } as Express.Multer.File,
        'notebook-1',
        user,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(storageService.storeDocument).not.toHaveBeenCalled();
  });
});

const user = {
  email: 'user@example.com',
  subject: 'user-1',
  username: 'user@example.com',
};

function createDocument(overrides: Record<string, unknown> = {}) {
  return {
    byteSize: 18,
    chunkCount: 0,
    contentType: 'text/plain',
    createdDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    id: 'document-1',
    lastUpdatedDateUtc: new Date('2026-01-01T00:00:00.000Z'),
    notebookId: 'notebook-1',
    originalFileName: 'notes.txt',
    ownerUserId: 'user-1',
    status: 'failed',
    storageKey: 'user-1/notebook-1/document-1.txt',
    textPreview: 'First chunk Second',
    ...overrides,
  };
}

function createService(overrides: {
  chunksRepository?: DocumentChunksRepository;
  documentsRepository?: DocumentsRepository;
  knowledgeBaseService?: KnowledgeBaseService;
  storageService?: DocumentStorageService;
  textExtractor?: DocumentTextExtractorService;
} = {}) {
  return new DocumentIngestionService(
    overrides.documentsRepository ?? ({} as DocumentsRepository),
    overrides.chunksRepository ?? ({} as DocumentChunksRepository),
    overrides.storageService ??
      ({
        deleteDocument: jest.fn(),
        storeDocument: jest.fn(),
      } as unknown as DocumentStorageService),
    overrides.textExtractor ??
      ({
        extractText: jest.fn(async () => 'First chunk Second chunk'),
      } as unknown as DocumentTextExtractorService),
    {
      splitText: jest.fn(async () => ['First chunk', 'Second chunk']),
    } as unknown as DocumentChunkingService,
    overrides.knowledgeBaseService ??
      ({
        deleteDocument: jest.fn(),
        ingestDocument: jest.fn(),
        isBedrockKnowledgeBaseEnabled: false,
      } as unknown as KnowledgeBaseService),
  );
}

function file(text: string) {
  return {
    buffer: Buffer.from(text),
    mimetype: 'text/plain',
    originalname: 'notes.txt',
    size: Buffer.byteLength(text),
  } as Express.Multer.File;
}
