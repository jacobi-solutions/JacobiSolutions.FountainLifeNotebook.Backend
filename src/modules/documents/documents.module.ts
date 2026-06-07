import { Module, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AwsModule } from '../aws/aws.module';
import { KnowledgeBaseModule } from '../knowledge-base/knowledge-base.module';
import { NotebooksModule } from '../notebooks/notebooks.module';
import type { DocumentStorageConfig } from '../../shared/config/app.config';
import { DocumentChunksRepository } from './document-chunks.repository';
import { DocumentChunkingService } from './document-chunking.service';
import { DocumentIngestionService } from './document-ingestion.service';
import { DocumentStorageService } from './document-storage.service';
import { DocumentTextExtractorService } from './document-text-extractor.service';
import { DocumentsController } from './documents.controller';
import { DocumentsRepository } from './documents.repository';
import { DocumentsService } from './documents.service';
import { LocalDocumentStorageService } from './local-document-storage.service';
import { S3DocumentStorageService } from './s3-document-storage.service';
import {
  DocumentChunk,
  DocumentChunkSchema,
} from './schemas/document-chunk.schema';
import {
  DocumentRecord,
  DocumentRecordSchema,
} from './schemas/document-record.schema';

@Module({
  imports: [
    AwsModule,
    KnowledgeBaseModule,
    forwardRef(() => NotebooksModule),
    MongooseModule.forFeature([
      { name: DocumentRecord.name, schema: DocumentRecordSchema },
      { name: DocumentChunk.name, schema: DocumentChunkSchema },
    ]),
  ],
  controllers: [DocumentsController],
  providers: [
    DocumentChunksRepository,
    DocumentChunkingService,
    DocumentIngestionService,
    DocumentsRepository,
    DocumentsService,
    DocumentTextExtractorService,
    LocalDocumentStorageService,
    S3DocumentStorageService,
    {
      inject: [
        ConfigService,
        LocalDocumentStorageService,
        S3DocumentStorageService,
      ],
      provide: DocumentStorageService,
      useFactory: (
        configService: ConfigService,
        localStorage: LocalDocumentStorageService,
        s3Storage: S3DocumentStorageService,
      ) => {
        const config =
          configService.getOrThrow<DocumentStorageConfig>('documentStorage');
        return config.documentStorageProvider === 's3'
          ? s3Storage
          : localStorage;
      },
    },
  ],
  exports: [DocumentChunksRepository, DocumentsRepository, DocumentsService],
})
export class DocumentsModule {}
