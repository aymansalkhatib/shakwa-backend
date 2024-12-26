import { HttpException, HttpStatus } from '@nestjs/common';

export function getErrorMessage(exception: Error): string | string[] {
  if (exception instanceof HttpException) {
    const response = exception.getResponse();
    if (typeof response === 'object' && 'message' in response) {
      return response.message as string | string[];
    }
    return exception.message;
  }
  return 'Internal server error';
}

export function getErrorStatus(exception: Error): number {
  return exception instanceof HttpException
    ? exception.getStatus()
    : HttpStatus.INTERNAL_SERVER_ERROR;
}

export function getErrorName(exception: Error): string {
  if (exception instanceof HttpException) {
    return HttpStatus[exception.getStatus()] || exception.name;
  }
  return exception.name || 'InternalServerError';
}
