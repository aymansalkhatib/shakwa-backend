import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseStorageService } from './base-storage.service';
import { LocalStorageConfig } from './types';

@Injectable()
export class LocalStorageService extends BaseStorageService {
  private readonly BATCH_SIZE = 100;

  constructor(private readonly config: LocalStorageConfig) {
    super();
  }

  /**
   * Stores file in local filesystem
   * @returns Relative path (without BASE_PATH) for database storage consistency
   */
  async store(file: Express.Multer.File, filename?: string, customPath?: string): Promise<string> {
    const finalFilename = this.buildFilename(file, filename);
    const relativePath = this.buildRelativePath(finalFilename, customPath);
    const absolutePath = path.join(this.config.BASE_PATH, relativePath);

    await this.ensureDirectoryExists(path.dirname(absolutePath));

    try {
      await fs.writeFile(absolutePath, file.buffer);
      return relativePath; // Return relative path for consistency
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to store file at ${absolutePath}: ${message}`);
    }
  }

  /**
   * Retrieves file from local filesystem
   * @param fileId - Relative path to the file
   */
  async retrieve(fileId: string): Promise<Buffer> {
    // Build absolute path, handling both relative and absolute inputs safely
    const filePath = path.isAbsolute(fileId) ? fileId : path.join(this.config.BASE_PATH, fileId);

    try {
      return await fs.readFile(filePath);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to retrieve file: ${message}`);
    }
  }

  /**
   * Deletes file from local filesystem
   * @param fileId - Relative path to the file
   */
  async delete(fileId: string): Promise<boolean> {
    // Build absolute path, handling both relative and absolute inputs safely
    const filePath = path.isAbsolute(fileId) ? fileId : path.join(this.config.BASE_PATH, fileId);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to delete file: ${message}`);
    }
  }

  /**
   * Replaces an existing file with a new one
   * @returns Relative path of the new file
   */
  async replace(
    oldFilePath: string,
    newFile: Express.Multer.File,
    customPath?: string,
  ): Promise<string> {
    try {
      await this.delete(oldFilePath);
    } catch {
      // Ignore if file doesn't exist
    }

    const filename = path.basename(oldFilePath);
    const relativePath = await this.store(newFile, filename, customPath);
    return relativePath;
  }

  /**
   * Stores multiple files in local filesystem using batched operations
   */
  async storeMany(files: Express.Multer.File[], customPath?: string): Promise<string[]> {
    return await this.processBatch(files, this.BATCH_SIZE, async (batch) => {
      return await Promise.all(batch.map((file) => this.store(file, undefined, customPath)));
    });
  }

  /**
   * Deletes multiple files from local filesystem using batched operations
   */
  async deleteMany(fileIds: string[]): Promise<boolean[]> {
    return await this.processBatch(fileIds, this.BATCH_SIZE, async (batch) => {
      return await Promise.all(
        batch.map(async (fileId) => {
          try {
            return await this.delete(fileId);
          } catch {
            return false;
          }
        }),
      );
    });
  }

  /**
   * Builds the final filename, optionally appending the extension
   */
  private buildFilename(file: Express.Multer.File, filename?: string): string {
    if (!filename) {
      return file.originalname;
    }

    const extension = path.extname(file.originalname);
    return filename.endsWith(extension) ? filename : filename + extension;
  }

  /**
   * Ensures directory exists, creates if not
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }
}
