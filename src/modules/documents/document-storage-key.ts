import { randomUUID } from 'crypto';
import { extname } from 'path';

export function createDocumentStorageKey(
  ownerUserId: string,
  notebookId: string,
  originalFileName: string,
) {
  const ownerSegment = ownerUserId.replace(/[^a-zA-Z0-9._-]/g, '_') || 'user';
  const notebookSegment =
    notebookId.replace(/[^a-zA-Z0-9._-]/g, '_') || 'notebook';
  const extension = extname(originalFileName).toLowerCase();
  return `${ownerSegment}/${notebookSegment}/${randomUUID()}${extension}`;
}
