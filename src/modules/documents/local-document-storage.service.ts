import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { mkdir, rm, writeFile } from 'fs/promises';
import { dirname, extname, join, resolve } from 'path';
import type { FountainLifeConfig } from '../../shared/config/app.config';
import { DocumentStorageService, StoreDocumentRequest, StoredDocumentObject } from './document-storage.service';

@Injectable()
export class LocalDocumentStorageService extends DocumentStorageService {
  private readonly storageRoot: string;

  constructor(configService: ConfigService) {
    super();
    const config = configService.getOrThrow<FountainLifeConfig>('fountainLife');
    this.storageRoot = resolve(process.cwd(), config.documentStorageRoot);
  }

  async storeDocument(request: StoreDocumentRequest): Promise<StoredDocumentObject> {
    const storageKey = this.createStorageKey(request.ownerUserId, request.originalFileName);
    const filePath = this.resolveStoragePath(storageKey);

    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, request.body);

    return { storageKey };
  }

  async deleteDocument(storageKey: string): Promise<void> {
    await rm(this.resolveStoragePath(storageKey), { force: true });
  }

  private createStorageKey(ownerUserId: string, originalFileName: string) {
    const ownerSegment = ownerUserId.replace(/[^a-zA-Z0-9._-]/g, '_');
    const extension = extname(originalFileName).toLowerCase();
    return join(ownerSegment, `${randomUUID()}${extension}`);
  }

  private resolveStoragePath(storageKey: string) {
    const filePath = resolve(this.storageRoot, storageKey);
    if (!filePath.startsWith(this.storageRoot)) {
      throw new Error('Resolved document path escaped the storage root.');
    }

    return filePath;
  }
}
