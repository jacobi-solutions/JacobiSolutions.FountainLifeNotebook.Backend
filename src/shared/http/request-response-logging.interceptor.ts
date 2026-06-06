import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { ResponseFactory } from '../contracts/response.factory';
import type { RequestWithCorrelationId } from './request-with-correlation-id';

@Injectable()
export class RequestResponseLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(RequestResponseLoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<RequestWithCorrelationId>();
    const startedAt = Date.now();

    this.logger.log({
      body: sanitizeForLog(request.body),
      correlationId: request.correlationId,
      method: request.method,
      path: request.originalUrl,
      event: 'request.received',
    });

    return next.handle().pipe(
      tap((responseBody) => {
        if (ResponseFactory.isBaseResponse(responseBody) && !responseBody.correlationId) {
          responseBody.correlationId = request.correlationId;
        }

        this.logger.log({
          correlationId: request.correlationId,
          durationMs: Date.now() - startedAt,
          method: request.method,
          path: request.originalUrl,
          response: sanitizeForLog(responseBody),
          event: 'request.completed',
        });
      }),
    );
  }
}

export function sanitizeForLog(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForLog(item));
  }

  if (typeof value !== 'object' || value === null) {
    return value;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      shouldRedact(key) ? '[REDACTED]' : sanitizeForLog(entry),
    ]),
  );
}

function shouldRedact(key: string) {
  const normalized = key.toLowerCase();
  return (
    normalized.includes('actor') ||
    normalized.includes('authorization') ||
    normalized.includes('apikey') ||
    normalized.includes('content') ||
    normalized.includes('description') ||
    normalized.includes('email') ||
    normalized.includes('message') ||
    normalized.includes('password') ||
    normalized.includes('payload') ||
    normalized.includes('secret') ||
    normalized.includes('subject') ||
    normalized.includes('text') ||
    normalized.includes('token') ||
    normalized.includes('username') ||
    normalized === 'key'
  );
}
