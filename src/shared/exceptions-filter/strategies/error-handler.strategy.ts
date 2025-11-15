import { ErrorResponse } from '../interfaces/error-response.interface';

/**
 * Base interface for error handling strategies
 */
export interface ErrorHandlerStrategy {
  /**
   * Checks if this strategy can handle the given error
   */
  canHandle(error: Error): boolean;

  /**
   * Processes the error and returns a standardized error responses
   */
  handle(error: Error, requestId: string): ErrorResponse;
}

/**
 * Abstract base class for error handling strategies
 */
export default abstract class BaseErrorHandler implements ErrorHandlerStrategy {
  abstract canHandle(error: Error): boolean;

  abstract handle(error: Error, requestId: string): ErrorResponse;

  /**
   * Creates a base error responses structure
   */
  protected createBaseResponse(
    statusCode: number,
    errors: string,
    message: string | string[],
    requestId: string,
  ): ErrorResponse {
    return {
      statusCode,
      errors,
      message,
      context: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export { BaseErrorHandler };
