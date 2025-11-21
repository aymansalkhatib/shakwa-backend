import { MultiUploadFileOptions } from './multi-upload-file-options.interface';

/**
 * Options for uploading multiple files in a single operation
 */
export interface MultiUploadOptions {
  /** Array of files to upload */
  files: MultiUploadFileOptions[];
  /** Maximum allowed file size in bytes (applies to all files) */
  maxSize?: number;
}
