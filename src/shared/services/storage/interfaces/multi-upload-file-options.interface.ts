/**
 * Options for uploading a single file in a batch upload operation
 */
export interface MultiUploadFileOptions {
  /** The file buffer to upload */
  file: Buffer;
  /** The path where the file should be stored */
  path: string;
}
