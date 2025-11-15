import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Abstract base class for file storage implementations
 * Defines common interface for different storage providers
 */
export abstract class BaseStorageService {
  /**
   * Stores a file in the storage system
   * @param file - The file to store
   * @param path - Optional path where the file should be stored
   */
  abstract store(file: Express.Multer.File, path?: string): Promise<string>;

  /**
   * Retrieves file from storage
   * @param fileId - Unique identifier or path of the file
   */
  abstract retrieve(fileId: string): Promise<Buffer>;

  /**
   * Deletes file from storage
   * @param fileId - Unique identifier or path of the file
   */
  abstract delete(fileId: string): Promise<boolean>;

  /**
   * Replaces an existing file with a new one.
   *
   * @param oldFilePath - The path or identifier of the file to be replaced.
   * @param newFile - The new file to store.
   * @param customPath - Optional path for the new file.
   * @returns The path of the newly stored file.
   */
  abstract replace(
    oldFilePath: string,
    newFile: Express.Multer.File,
    customPath?: string,
  ): Promise<string>;

  /**
   * Stores multiple files in the storage system using batch operations
   * @param files - Array of files to store
   * @param path - Optional path where the files should be stored
   * @returns Array of stored file paths
   */
  abstract storeMany(
    files: Express.Multer.File[],
    path?: string,
  ): Promise<string[]>;

  /**
   * Deletes multiple files from storage using batch operations
   * @param fileIds - Array of file identifiers or paths to delete
   * @returns Array of boolean values indicating success/failure for each deletion
   */
  abstract deleteMany(fileIds: string[]): Promise<boolean[]>;

  /**
   * Ensures directory exists, creates if not
   */
  async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * Builds a storage path for the file.
   *
   * @param baseUrl - The base URL or directory for storage.
   * @param filename - The original file name.
   * @param customPath - Optional custom directory path to store the file.
   * @returns The full storage path for the file.
   */
  buildStoragePath(
    baseUrl: string,
    filename: string,
    customPath?: string,
  ): string {
    const sanitizedCustomPath = customPath || ''; // Default to empty string if customPath is not provided
    // const uniqueFileName = createUniqueFileName(filename); // Generate a unique file name

    return path.join(baseUrl, sanitizedCustomPath, filename); // Build and return the full storage path
  }

  /**
   * Processes files in batches for optimal performance
   * @param items - Array of items to process
   * @param batchSize - Size of each batch
   * @param processFn - Function to process each batch
   */
  protected async processBatch<T, R>(
    items: T[],
    batchSize: number,
    processFn: (batch: T[]) => Promise<R[]>,
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processFn(batch);
      results.push(...batchResults);
    }

    return results;
  }
}
