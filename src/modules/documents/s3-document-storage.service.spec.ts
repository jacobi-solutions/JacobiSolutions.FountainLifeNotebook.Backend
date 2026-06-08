import { ConfigService } from '@nestjs/config';
import { StorageService } from '../aws/storage.service';
import { S3DocumentStorageService } from './s3-document-storage.service';

describe('S3DocumentStorageService', () => {
  it('stores and deletes Bedrock sidecar metadata with the document key', async () => {
    const storageService = {
      deleteObject: jest.fn(async () => undefined),
      putObject: jest.fn(async () => undefined),
    } as unknown as StorageService;
    const service = new S3DocumentStorageService(
      {
        getOrThrow: jest.fn(() => ({
          storageBucketName: 'documents-bucket',
        })),
      } as unknown as ConfigService,
      storageService,
    );

    await expect(
      service.storeDocumentMetadata({
        body: '{"metadataAttributes":{}}',
        contentType: 'application/json',
        storageKey: 'user-1/notebook-1/document-1.pdf',
      }),
    ).resolves.toEqual({
      storageKey: 'user-1/notebook-1/document-1.pdf.metadata.json',
      storageUri:
        's3://documents-bucket/user-1/notebook-1/document-1.pdf.metadata.json',
    });

    expect(storageService.putObject).toHaveBeenCalledWith({
      body: '{"metadataAttributes":{}}',
      contentType: 'application/json',
      key: 'user-1/notebook-1/document-1.pdf.metadata.json',
    });

    await expect(
      service.deleteDocument('user-1/notebook-1/document-1.pdf'),
    ).resolves.toBeUndefined();
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'user-1/notebook-1/document-1.pdf',
    );
    expect(storageService.deleteObject).toHaveBeenCalledWith(
      'user-1/notebook-1/document-1.pdf.metadata.json',
    );
  });
});
