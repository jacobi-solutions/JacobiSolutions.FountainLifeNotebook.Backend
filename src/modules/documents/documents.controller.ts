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
import { ResponseFactory } from '../../shared/data-contracts/response-factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { MAX_DOCUMENT_UPLOAD_BYTES } from './document.constants';
import { DocumentsService } from './documents.service';
import { DeleteDocumentRequest } from './data-contracts/delete-document-request';
import { ListDocumentsRequest } from './data-contracts/list-documents-request';
import { ListDocumentsResponse } from './data-contracts/list-documents-response';
import { UploadDocumentResponse } from './data-contracts/upload-document-response';
import { BaseResponse } from '../../shared/data-contracts/base-response';

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
    return ResponseFactory.successWith(
      { document: await this.documentsService.uploadDocument(file, user) },
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
    return ResponseFactory.successWith(
      { documents: await this.documentsService.listDocuments(user) },
      correlationId,
    );
  }

  @Post('delete-document')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: BaseResponse })
  async deleteDocument(
    @Body() request: DeleteDocumentRequest,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.documentId) {
      return ResponseFactory.failure(
        {
          errorCode: 'VALIDATION_ERROR',
          errorMessage: 'Document id is required.',
        },
        correlationId,
      );
    }

    await this.documentsService.deleteDocument(request.documentId, user);

    return ResponseFactory.success(correlationId);
  }
}
