export interface StoreDocumentRequest {
  body: Buffer;
  contentType: string;
  notebookId: string;
  originalFileName: string;
  ownerUserId: string;
}

export interface StoredDocumentObject {
  storageKey: string;
  storageUri?: string;
}

export interface StoreDocumentMetadataRequest {
  body: Buffer | string;
  contentType: string;
  storageKey: string;
}

export interface StoredDocumentMetadataObject {
  storageKey: string;
  storageUri?: string;
}

export abstract class DocumentStorageService {
  abstract deleteDocument(storageKey: string): Promise<void>;
  abstract storeDocument(
    request: StoreDocumentRequest,
  ): Promise<StoredDocumentObject>;
  abstract storeDocumentMetadata(
    request: StoreDocumentMetadataRequest,
  ): Promise<StoredDocumentMetadataObject>;
}
