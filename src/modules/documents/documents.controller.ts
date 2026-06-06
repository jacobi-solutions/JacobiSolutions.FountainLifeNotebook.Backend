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
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ResponseFactory } from '../../shared/contracts/response.factory';
import { CorrelationId } from '../../shared/http/correlation-id.decorator';
import { AuthenticatedUserGuard } from '../auth/authenticated-user.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { AuthenticatedUser } from '../auth/models/authenticated-user';
import { DocumentsService } from './documents.service';
import { DeleteDocumentRequestDto } from './dto/delete-document.dto';
import { DeleteDocumentResponseDto } from './dto/delete-document-response.dto';
import { ListDocumentsRequestDto } from './dto/list-documents.dto';
import { ListDocumentsResponseDto } from './dto/list-documents-response.dto';
import { UploadDocumentResponseDto } from './dto/upload-document-response.dto';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

@ApiBearerAuth()
@ApiTags('documents')
@UseGuards(AuthenticatedUserGuard)
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }))
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
  @ApiOkResponse({ type: UploadDocumentResponseDto })
  async uploadDocument(
    @UploadedFile() file: Express.Multer.File | undefined,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(await this.documentsService.uploadDocument(file, user), correlationId);
  }

  @Post('list')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ListDocumentsResponseDto })
  async listDocuments(
    @Body() _request: ListDocumentsRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    return ResponseFactory.success(await this.documentsService.listDocuments(user), correlationId);
  }

  @Post('delete')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: DeleteDocumentResponseDto })
  async deleteDocument(
    @Body() request: DeleteDocumentRequestDto,
    @CurrentUser() user: AuthenticatedUser,
    @CorrelationId() correlationId?: string,
  ) {
    if (!request.payload) {
      return ResponseFactory.failure(
        { errorCode: 'VALIDATION_ERROR', errorMessage: 'Request payload is required.' },
        correlationId,
      );
    }

    return ResponseFactory.success(
      await this.documentsService.deleteDocument(request.payload.documentId, user),
      correlationId,
    );
  }
}
