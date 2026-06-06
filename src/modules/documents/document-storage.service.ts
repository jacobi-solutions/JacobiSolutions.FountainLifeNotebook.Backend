export interface StoreDocumentRequest {
  body: Buffer;
  contentType: string;
  originalFileName: string;
  ownerUserId: string;
}

export interface StoredDocumentObject {
  storageKey: string;
}

export abstract class DocumentStorageService {
  abstract deleteDocument(storageKey: string): Promise<void>;
  abstract storeDocument(request: StoreDocumentRequest): Promise<StoredDocumentObject>;
}
