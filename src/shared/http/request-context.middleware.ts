import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { NextFunction, Response } from 'express';
import type { RequestWithCorrelationId } from './request-with-correlation-id';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithCorrelationId, response: Response, next: NextFunction) {
    const body = request.body as { correlationId?: string } | undefined;
    const headerValue = request.header('x-correlation-id');
    const correlationId = body?.correlationId ?? headerValue ?? randomUUID();

    request.correlationId = correlationId;
    response.setHeader('x-correlation-id', correlationId);

    next();
  }
}
