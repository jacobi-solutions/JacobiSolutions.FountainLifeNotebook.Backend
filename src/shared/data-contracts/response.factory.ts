import { BaseResponse } from './base-response';
import { ErrorInfo } from './error-info';

export class ResponseFactory {
  static success<TData>(data: TData, correlationId?: string): BaseResponse<TData> {
    return {
      correlationId,
      data,
      errors: [],
      isSuccess: true,
    };
  }

  static failure<TData = never>(
    errors: ErrorInfo | ErrorInfo[],
    correlationId?: string,
  ): BaseResponse<TData> {
    return {
      correlationId,
      errors: Array.isArray(errors) ? errors : [errors],
      isSuccess: false,
    };
  }

  static exception(error: Error, correlationId?: string, includeStackTrace = false) {
    const response = ResponseFactory.failure(
      {
        errorCode: 'EXCEPTION',
        errorMessage: error.message,
      },
      correlationId,
    );

    if (includeStackTrace) {
      return {
        ...response,
        stackTrace: error.stack,
      };
    }

    return response;
  }

  static isBaseResponse(value: unknown): value is BaseResponse {
    return (
      typeof value === 'object' &&
      value !== null &&
      'isSuccess' in value &&
      'errors' in value &&
      Array.isArray((value as BaseResponse).errors)
    );
  }
}
