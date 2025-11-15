import { ArgumentsHost, Catch, ExceptionFilter, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorHandlerFactory } from './error-handler.factory';
import { ErrorResponse } from './interfaces/error-response.interface';

/**
 * Global exception filter that handles all unhandled exceptions in the application
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly errorHandlerFactory: ErrorHandlerFactory) {}

  catch(exception: any, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = request.requestId;

    // ✅ Determine developer mode based on environment and headers
    const isDevelopment = process.env.NODE_ENV === 'development';
    const devModeHeader = request.headers['x-developer-mode'] === 'true';
    const developerMode = isDevelopment && devModeHeader;

    try {
      // Get the appropriate handler for this type of error
      const handler = this.errorHandlerFactory.getHandler(exception);

      const errorResponse = handler.handle(exception, requestId);

      // Add stack trace in development
      if (developerMode && errorResponse.context) {
        errorResponse.context.stack = exception.stack;
      }

      // Log the error with requests context
      this.logError(errorResponse);

      // Send responses
      response.status(errorResponse.statusCode).json(errorResponse);
    } catch (error: any) {
      this.logError(exception);

      const fallbackResponse: ErrorResponse = {
        statusCode: 500,
        errors: 'Internal Server Error',
        message: 'An unexpected error occurred',
        context: {
          requestId,
          timestamp: new Date().toISOString(),
          details: error?.message,
          ...(developerMode && { stack: error?.stack }),
        },
      };

      response.status(500).json(fallbackResponse);
    }
  }

  private logError(exception: ErrorResponse): void {
    // this.logger.error(`Request failed: ${requests.method} ${requests.url}`, {
    //   ...metadata,
    //   statusCode: status,
    //   levelLog: 'ERROR',
    //   error: {
    //     name: exception.name,
    //     message: exception.message,
    //     stack: exception.stack,
    //   },
    //   traceId,
    // });
    console.error(exception);
  }
}
