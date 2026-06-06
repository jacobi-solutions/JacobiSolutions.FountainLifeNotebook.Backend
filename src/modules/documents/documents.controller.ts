import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ResponseFactory } from '../../shared/data-contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document.constants';
import { DocumentsService } from './documents.service';
import { DeleteDocumentRequest } from './data-contracts/delete-document';
import { DeleteDocumentResponse } from './data-contracts/delete-document-response';
import { ListDocumentsRequest } from './data-contracts/list-documents';
import { ListDocumentsResponse } from './data-contracts/list-documents-response';
import { UploadDocumentResponse } from './data-contracts/upload-document-response';

@ApiBearerAuth()
@ApiTags('documents')
@UseGuards(AuthenticatedUserGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload-document')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_DOCUMENT_UPLOAD_BYTES },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      properties: {
        file: {
          format: 'binary',
          type: 'string',
        },
      },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiOkResponse({ type: UploadDocumentResponse })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      await this.documentsService.uploadDocument(file, user),
      correlationId,
    );
  }

  @Post('list-documents')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListDocumentsResponse })
  async listDocuments(
    @Body() _request: ListDocumentsRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(
      await this.documentsService.listDocuments(user),
      correlationId,
    );
  }

  @Post('delete-document')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DeleteDocumentResponse })
  async deleteDocument(
    @Body() request: DeleteDocumentRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.payload) {
      return ResponseFactory.failure(
        {
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Request payload is required.',
        },
        correlationId,
      );
    }

    return ResponseFactory.success(
      await this.documentsService.deleteDocument(
        request.payload.documentId,
        user,
      ),
      correlationId,
    );
  }
}
