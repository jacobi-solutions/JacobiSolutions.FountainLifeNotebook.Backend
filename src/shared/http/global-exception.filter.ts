import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { ResponseFactory } from '../data-contracts/response-factory';
import type { RequestWithCorrelationId } from './request-with-correlation-id';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const request = context.getRequest<RequestWithCorrelationId>();
    const response = context.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const normalized = normalizeException(exception);

    this.logger.error({
      correlationId: request.correlationId,
      error: normalized.errorMessage,
      event: 'request.failed',
      method: request.method,
      path: request.originalUrl,
      status,
    });

    response.status(status).json(ResponseFactory.failure(normalized, request.correlationId));
  }
}

function normalizeException(exception: unknown) {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && response !== null) {
      const payload = response as { message?: unknown; error?: unknown };
      const message = Array.isArray(payload.message)
        ? payload.message.join('; ')
        : typeof payload.message === 'string'
          ? payload.message
          : exception.message;

      return {
        errorCode: typeof payload.error === 'string' ? payload.error : 'HTTP_ERROR',
        errorMessage: message,
      };
    }

    return {
      errorCode: 'HTTP_ERROR',
      errorMessage: exception.message,
    };
  }

  if (exception instanceof Error) {
    return {
      errorCode: 'EXCEPTION',
      errorMessage: exception.message,
    };
  }

  return {
    errorCode: 'EXCEPTION',
    errorMessage: 'An unexpected error occurred.',
  };
}
