import { ConfigService } from '@nestjs/config';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { LocalDocumentStorageService } from './local-document-storage.service';

describe('LocalDocumentStorageService', () => {
  let storageRoot: string;

  beforeEach(async () => {
    storageRoot = await mkdtemp(join(tmpdir(), 'fountain-life-notebook-'));
  });

  afterEach(async () => {
    await rm(storageRoot, { force: true, recursive: true });
  });

  it('stores documents under a sanitized owner segment and deletes them by storage key', async () => {
    const service = new LocalDocumentStorageService({
      getOrThrow: jest.fn(() => ({ documentStorageRoot: storageRoot })),
    } as unknown as ConfigService);

    const stored = await service.storeDocument({
      body: Buffer.from('hello world'),
      contentType: 'text/plain',
      notebookId: 'notebook/../one',
      originalFileName: 'Notes.TXT',
      ownerUserId: 'user/../one',
    });

    expect(stored.storageKey).toMatch(
      /^user_.._one\/notebook_.._one\/[a-f0-9-]+\.txt$/,
    );
    await expect(
      readFile(join(storageRoot, stored.storageKey), 'utf8'),
    ).resolves.toBe('hello world');

    await expect(
      service.storeDocumentMetadata({
        body: '{"metadataAttributes":{}}',
        contentType: 'application/json',
        storageKey: stored.storageKey,
      }),
    ).resolves.toEqual({
      storageKey: `${stored.storageKey}.metadata.json`,
    });
    await expect(
      readFile(join(storageRoot, `${stored.storageKey}.metadata.json`), 'utf8'),
    ).resolves.toBe('{"metadataAttributes":{}}');

    await expect(
      service.deleteDocument(stored.storageKey),
    ).resolves.toBeUndefined();
    await expect(
      readFile(join(storageRoot, stored.storageKey), 'utf8'),
    ).rejects.toThrow();
    await expect(
      readFile(join(storageRoot, `${stored.storageKey}.metadata.json`), 'utf8'),
    ).rejects.toThrow();
  });

  it('rejects storage keys that escape the local storage root', async () => {
    const service = new LocalDocumentStorageService({
      getOrThrow: jest.fn(() => ({ documentStorageRoot: storageRoot })),
    } as unknown as ConfigService);

    await expect(service.deleteDocument('../outside.txt')).rejects.toThrow(
      'Resolved document path escaped the storage root.',
    );
  });
});
