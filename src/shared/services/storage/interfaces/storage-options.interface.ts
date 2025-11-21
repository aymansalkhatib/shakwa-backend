export interface StorageOptions {
  path: string;
  mimeType?: string;
  maxSize?: number;
}

export interface UploadResult {
  url: string;
  path: string;
  key?: string;
}
