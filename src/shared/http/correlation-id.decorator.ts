import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { RequestWithCorrelationId } from './request-with-correlation-id';

export const CorrelationId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string | undefined => {
    const request = context.switchToHttp().getRequest<RequestWithCorrelationId>();
    return request.correlationId;
  },
);
