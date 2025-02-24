export interface LogMetadata {
  statusCode?: number;
  responseTime?: string;
  userId?: string;
  method?: string;
  url?: string;
  ip?: string;
  userAgent?: string;
  body?: any;
  time?: any;
  context?: any;
  contentLength?: any;
  level_?: any;
  message?: any;
  query?: any;
  params?: any;
  headers?: any;


  [key: string]: any;
}
