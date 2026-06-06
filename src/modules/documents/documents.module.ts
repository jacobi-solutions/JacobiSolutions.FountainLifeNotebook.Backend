import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { LocalDocumentStorageService } from './local-document-storage.service';
import { DocumentChunk, DocumentChunkSchema } from './schemas/document-chunk.schema';
import { DocumentRecord, DocumentRecordSchema } from './schemas/document-record.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
      { name: DocumentChunk.name, schema: DocumentChunkSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentChunksRepository,
    DocumentChunkingService,
    DocumentsRepository,
    DocumentsService,
    DocumentTextExtractorService,
    {
      provide: DocumentStorageService,
      useClass: LocalDocumentStorageService,
    },
  ],
  exports: [DocumentChunksRepository, DocumentsRepository, DocumentsService],
})
export class DocumentsModule {}
