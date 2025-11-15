/**
 * Represents the standardized error responses structure
 */
export interface ErrorResponse {
  /** HTTP status code for the error */
  statusCode: number;

  /** Human-readable error message */
  errors: string;

  /** Human-readable error message */
  message: string | string[];

  /** Optional additional error context */
  context?: ErrorResponseContext;
}

export interface ErrorResponseContext {
  /** Additional error details */
  details?: Record<string, any> | string;

  /** Stack trace */
  stack?: string;

  /** Request ID for error tracking */
  requestId: string;

  /** Timestamp when the error occurred */
  timestamp: string;
}
