import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentsModule } from '../documents/documents.module';
import { NotebooksController } from './notebooks.controller';
import { NotebookInvitationService } from './notebook-invitation.service';
import { NotebooksRepository } from './notebooks.repository';
import { NotebooksService } from './notebooks.service';
import { Notebook, NotebookSchema } from './schemas/notebook.schema';

@Module({
  imports: [
    forwardRef(() => DocumentsModule),
    MongooseModule.forFeature([{ name: Notebook.name, schema: NotebookSchema }]),
  ],
  controllers: [NotebooksController],
  providers: [NotebookInvitationService, NotebooksRepository, NotebooksService],
  exports: [NotebooksRepository, NotebooksService],
})
export class NotebooksModule {}
