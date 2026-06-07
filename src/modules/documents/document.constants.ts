export const MAX_DOCUMENT_UPLOAD_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_TEXT_PREVIEW_LENGTH = 320;
export const DOCUMENT_CHUNK_SIZE = 1200;
export const DOCUMENT_CHUNK_OVERLAP = 200;

export const DOCUMENT_PROCESSING_STATUSES = [
  'failed',
  'processing',
  'ready',
] as const;
export type DocumentProcessingStatus =
  (typeof DOCUMENT_PROCESSING_STATUSES)[number];
