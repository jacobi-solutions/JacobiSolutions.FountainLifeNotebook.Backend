import { randomUUID } from 'crypto';
import { extname } from 'path';

export function createDocumentStorageKey(
  ownerUserId: string,
  originalFileName: string,
) {
  const ownerSegment = ownerUserId.replace(/[^a-zA-Z0-9._-]/g, '_') || 'user';
  const extension = extname(originalFileName).toLowerCase();
  return `${ownerSegment}/${randomUUID()}${extension}`;
}
