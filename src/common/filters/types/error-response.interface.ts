export interface ErrorResponse {
  status: string;
  status_code: number;
  message: string | string[];
  stack?: string;
}
