/**
 * Options for uploading a file to storage
 */
export interface StorageOptions {
  /** The path where the file should be stored */
  path: string;
  /** MIME type of the file */
  mimeType?: string;
  /** Maximum allowed file size in bytes */
  maxSize?: number;
}
