import { Injectable } from '@nestjs/common';
import { DocumentChunksRepository } from '../../documents/document-chunks.repository';

const MAX_RETRIEVED_CHUNKS = 6;
const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'based',
  'but',
  'can',
  'for',
  'from',
  'how',
  'into',
  'not',
  'the',
  'this',
  'that',
  'what',
  'when',
  'where',
  'with',
  'would',
  'you',
]);

export interface RetrievedNotebookChunk {
  chunkIndex: number;
  documentId: string;
  documentName: string;
  score: number;
  text: string;
}

@Injectable()
export class NotebookRetrievalService {
  constructor(private readonly chunksRepository: DocumentChunksRepository) {}

  async retrieve(question: string, ownerUserId: string, documentIds?: string[]): Promise<RetrievedNotebookChunk[]> {
    const queryTokens = tokenize(question);
    if (queryTokens.length === 0) {
      return [];
    }

    const selectedDocumentIds = normalizeDocumentIds(documentIds);
    const chunks = await this.chunksRepository.findByOwnerAndDocumentIds(
      ownerUserId,
      selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
    );

    return chunks
      .map((chunk): RetrievedNotebookChunk => ({
        chunkIndex: chunk.chunkIndex,
        documentId: chunk.documentId,
        documentName: chunk.documentName,
        score: scoreChunk(chunk.text, queryTokens),
        text: chunk.text,
      }))
      .filter((chunk) => chunk.score > 0)
      .sort((left, right) => right.score - left.score || left.chunkIndex - right.chunkIndex)
      .slice(0, MAX_RETRIEVED_CHUNKS);
  }
}

function normalizeDocumentIds(documentIds?: string[]) {
  return Array.from(new Set((documentIds ?? []).map((documentId) => documentId.trim()).filter(Boolean)));
}

function scoreChunk(text: string, queryTokens: string[]) {
  const chunkTokens = new Set(tokenize(text));
  return queryTokens.reduce((score, token) => score + (chunkTokens.has(token) ? 1 : 0), 0);
}

function tokenize(value: string) {
  return Array.from(
    new Set(
      (value.toLowerCase().match(/[a-z0-9]{2,}/g) ?? []).filter((token) => !STOP_WORDS.has(token)),
    ),
  );
}
