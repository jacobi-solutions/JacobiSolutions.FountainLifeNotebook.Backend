import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, relative, resolve } from 'path';
import type { DocumentStorageConfig } from '../../shared/config/app.config';
import {
  DocumentStorageService,
  StoreDocumentRequest,
  StoreDocumentMetadataRequest,
  StoredDocumentObject,
  StoredDocumentMetadataObject,
} from './document-storage.service';
import { createDocumentStorageKey } from './document-storage-key';

@Injectable()
export class LocalDocumentStorageService extends DocumentStorageService {
  private readonly storageRoot: string;

  constructor(configService: ConfigService) {
    super();
    const config =
      configService.getOrThrow<DocumentStorageConfig>('documentStorage');
    this.storageRoot = resolve(process.cwd(), config.documentStorageRoot);
  }

  async storeDocument(
    request: StoreDocumentRequest,
  ): Promise<StoredDocumentObject> {
    const storageKey = createDocumentStorageKey(
      request.ownerUserId,
      request.notebookId,
      request.originalFileName,
    );
    const filePath = this.resolveStoragePath(storageKey);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, request.body);

    return { storageKey };
  }

  async deleteDocument(storageKey: string): Promise<void> {
    await Promise.all([
      rm(this.resolveStoragePath(storageKey), { force: true }),
      rm(this.resolveStoragePath(createMetadataStorageKey(storageKey)), {
        force: true,
      }),
    ]);
  }

  async storeDocumentMetadata(
    request: StoreDocumentMetadataRequest,
  ): Promise<StoredDocumentMetadataObject> {
    const storageKey = createMetadataStorageKey(request.storageKey);
    const filePath = this.resolveStoragePath(storageKey);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, request.body);

    return { storageKey };
  }

  private resolveStoragePath(storageKey: string) {
    const filePath = resolve(this.storageRoot, storageKey);
    const relativePath = relative(this.storageRoot, filePath);
    if (relativePath.startsWith('..') || relativePath === '..') {
      throw new Error('Resolved document path escaped the storage root.');
    }

    return filePath;
  }
}

function createMetadataStorageKey(storageKey: string) {
  return `${storageKey}.metadata.json`;
}
