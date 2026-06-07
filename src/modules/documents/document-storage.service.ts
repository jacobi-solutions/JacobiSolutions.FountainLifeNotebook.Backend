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

export abstract class DocumentStorageService {
  abstract deleteDocument(storageKey: string): Promise<void>;
  abstract storeDocument(request: StoreDocumentRequest): Promise<StoredDocumentObject>;
}
