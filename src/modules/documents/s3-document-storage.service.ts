import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DocumentStorageConfig } from '../../shared/config/app.config';
import { StorageService } from '../aws/storage.service';
import {
  DocumentStorageService,
  StoreDocumentRequest,
  StoredDocumentObject,
} from './document-storage.service';
import { createDocumentStorageKey } from './document-storage-key';

@Injectable()
export class S3DocumentStorageService extends DocumentStorageService {
  private readonly bucketName?: string;

  constructor(
    configService: ConfigService,
    private readonly storageService: StorageService,
  ) {
    super();
    const config =
      configService.getOrThrow<DocumentStorageConfig>('documentStorage');
    this.bucketName = config.storageBucketName;
  }

  async storeDocument(
    request: StoreDocumentRequest,
  ): Promise<StoredDocumentObject> {
    const storageKey = createDocumentStorageKey(
      request.ownerUserId,
      request.notebookId,
      request.originalFileName,
    );

    await this.storageService.putObject({
      body: request.body,
      contentType: request.contentType,
      key: storageKey,
    });

    return {
      storageKey,
      storageUri: this.bucketName
        ? `s3://${this.bucketName}/${storageKey}`
        : undefined,
    };
  }

  async deleteDocument(storageKey: string): Promise<void> {
    await this.storageService.deleteObject(storageKey);
  }
}
