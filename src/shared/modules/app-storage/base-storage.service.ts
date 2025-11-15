import * as path from 'path';

/**
 * Abstract base class for file storage implementations
 * Defines common interface for different storage providers
 */
export abstract class BaseStorageService {
  /**
   * Stores a file in the storage system
   * @param file - The file to store
   * @param filename - The filename to use (with or without extension)
   * @param customPath - Optional subdirectory path where the file should be stored
   * @returns The full storage path of the stored file
   */
  abstract store(
    file: Express.Multer.File,
    filename?: string,
    customPath?: string,
  ): Promise<string>;

  /**
   * Retrieves file from storage
   * @param fileId - Unique identifier or path of the file
   * @returns File content as Buffer
   */
  abstract retrieve(fileId: string): Promise<Buffer>;

  /**
   * Deletes file from storage
   * @param fileId - Unique identifier or path of the file
   * @returns True if deletion was successful
   */
  abstract delete(fileId: string): Promise<boolean>;

  /**
   * Replaces an existing file with a new one
   * @param oldFilePath - The path or identifier of the file to be replaced
   * @param newFile - The new file to store
   * @param customPath - Optional path for the new file
   * @returns The path of the newly stored file
   */
  abstract replace(
    oldFilePath: string,
    newFile: Express.Multer.File,
    customPath?: string,
  ): Promise<string>;

  /**
   * Stores multiple files in the storage system using batch operations
   * @param files - Array of files to store
   * @param customPath - Optional subdirectory path where the files should be stored
   * @returns Array of stored file paths
   */
  abstract storeMany(files: Express.Multer.File[], customPath?: string): Promise<string[]>;

  /**
   * Deletes multiple files from storage using batch operations
   * @param fileIds - Array of file identifiers or paths to delete
   * @returns Array of boolean values indicating success/failure for each deletion
   */
  abstract deleteMany(fileIds: string[]): Promise<boolean[]>;

  /**
   * Builds a storage path for the file
   * @param baseDir - The base directory for storage
   * @param filename - The file name
   * @param customPath - Optional custom subdirectory path
   * @returns The full storage path
   */
  protected buildStoragePath(baseDir: string, filename: string, customPath?: string): string {
    if (customPath) {
      return path.join(baseDir, customPath, filename);
    }
    return path.join(baseDir, filename);
  }

  /**
   * Processes files in batches for optimal performance
   * @param items - Array of items to process
   * @param batchSize - Size of each batch
   * @param processFn - Function to process each batch
   * @returns Array of processed results
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
