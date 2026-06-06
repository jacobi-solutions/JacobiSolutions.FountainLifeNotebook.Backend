import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import {
  DOCUMENT_CHUNK_OVERLAP,
  DOCUMENT_CHUNK_SIZE,
} from './document.constants';

@Injectable()
export class DocumentChunkingService {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: DOCUMENT_CHUNK_OVERLAP,
    chunkSize: DOCUMENT_CHUNK_SIZE,
  });

  async splitText(text: string) {
    return this.splitter.splitText(text);
  }
}
