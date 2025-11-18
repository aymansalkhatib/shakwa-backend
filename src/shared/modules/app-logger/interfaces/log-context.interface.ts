export interface LogContext {
  context?: string;
  requestId?: string;
  userId?: string | number;
  [key: string]: any;
}
