import { Injectable } from '@nestjs/common';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

const CHUNK_OVERLAP = 200;
const CHUNK_SIZE = 1200;

@Injectable()
export class DocumentChunkingService {
  private readonly splitter = new RecursiveCharacterTextSplitter({
    chunkOverlap: CHUNK_OVERLAP,
    chunkSize: CHUNK_SIZE,
  });

  async splitText(text: string) {
    return this.splitter.splitText(text);
  }
}
