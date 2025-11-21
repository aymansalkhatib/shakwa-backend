import { MultiDeleteOptions } from './multi-delete-options.interface';
import { MultiUploadOptions } from './multi-upload-options.interface';
import { StorageOptions } from './storage-options.interface';
import { UploadResult } from './upload-result.interface';

/**
 * Interface for storage providers (Local, Supabase, Firebase, etc.)
 */
export interface IStorageProvider {
  /**
   * Upload a single file to storage
   * @param file - The file buffer to upload
   * @param options - Upload options including path and metadata
   * @returns Upload result with URL and path
   */
  upload(file: Buffer, options: StorageOptions): Promise<UploadResult>;

  /**
   * Upload multiple files to storage in a single operation
   * @param options - Multi-upload options containing array of files
   * @returns Array of upload results for each file
   */
  uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]>;

  /**
   * Delete a file from storage
   * @param path - The path of the file to delete
   */
  delete(path: string): Promise<void>;

  /**
   * Delete multiple files from storage in a single operation
   * @param options - Multi-delete options containing array of paths
   */
  deleteMultiple(options: MultiDeleteOptions): Promise<void>;

  /**
   * Get the public URL for a file
   * @param path - The path of the file
   * @returns Public URL to access the file
   */
  getUrl(path: string): Promise<string>;

  /**
   * Get the public URLs for multiple files
   * @param paths - Array of file paths
   * @returns Array of public URLs to access the files
   */
  getUrls(paths: string[]): Promise<string[]>;
}
