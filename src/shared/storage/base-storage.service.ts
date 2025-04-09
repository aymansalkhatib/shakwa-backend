import * as fs from 'fs/promises';
import * as path from 'path';
import { createUniqueFileName } from './functions/create-unique-file_name';
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
   * Retrieves a file from storage
   * @param fileId - Unique identifier or path of the file
   */
  abstract retrieve(fileId: string): Promise<Buffer>;

  /**
   * Deletes a file from storage
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
  buildStoragePath(baseUrl: string, filename: string, customPath?: string): string {
    const sanitizedCustomPath = customPath || ''; // Default to empty string if customPath is not provided
    const uniqueFileName = createUniqueFileName(filename); // Generate a unique file name

    return path.join(baseUrl, sanitizedCustomPath, uniqueFileName); // Build and return the full storage path
  }
}
