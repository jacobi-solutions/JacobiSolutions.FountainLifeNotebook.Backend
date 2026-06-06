import { Injectable } from '@nestjs/common';
import { StorageService } from '../aws/storage.service';
import {
  DocumentStorageService,
  StoreDocumentRequest,
  StoredDocumentObject,
} from './document-storage.service';
import { createDocumentStorageKey } from './document-storage-key';

@Injectable()
export class S3DocumentStorageService extends DocumentStorageService {
  constructor(private readonly storageService: StorageService) {
    super();
  }

  async storeDocument(
    request: StoreDocumentRequest,
  ): Promise<StoredDocumentObject> {
    const storageKey = createDocumentStorageKey(
      request.ownerUserId,
      request.originalFileName,
    );

    await this.storageService.putObject({
      body: request.body,
      contentType: request.contentType,
      key: storageKey,
    });

    return { storageKey };
  }

  async deleteDocument(storageKey: string): Promise<void> {
    await this.storageService.deleteObject(storageKey);
  }
}
