import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
 import { LocalStorageConfig } from './types';
import { BaseStorageService } from './base-storage.service';

@Injectable()
export class LocalStorageService extends BaseStorageService {
  constructor(private readonly localConfig?: LocalStorageConfig) {
    super();
  }

  /**
   * Stores file in local filesystem
   */
  async store(file: Express.Multer.File, customPath?: string): Promise<string> {
    const storagePath = super.buildStoragePath(
      this.localConfig.basePath,
      file.originalname,
      customPath,
    );

    await super.ensureDirectoryExists(path.dirname(storagePath));

    try {
      await fs.writeFile(storagePath, file.buffer);
    } catch (error) {
      throw new Error(`Failed to store file at ${storagePath}: ${error.message}`);
    }
    return storagePath;
  }

  /**
   * Retrieves file from local filesystem
   */
  async retrieve(fileId: string): Promise<Buffer> {
    const filePath = path.join(this.localConfig.basePath, fileId);

    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File not found
        throw new Error(`File not found: ${filePath}`);
      }
      // Other errors (e.g., permission issues)
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  }

  /**
   * Deletes file from local filesystem
   */
  async delete(fileId: string): Promise<boolean> {
    const filePath = path.join(this.localConfig.basePath, fileId);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File already doesn't exist
        throw new Error(`File not found: ${filePath}`);
      }
      // Other unexpected errors
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Replaces an existing file with a new one.
   */
  async replace(
    oldFilePath: string,
    newFile: Express.Multer.File,
    customPath?: string,
  ): Promise<string> {
    try {
      await this.delete(oldFilePath);
    } catch (error) {
      // You may choose to ignore if file doesn't exist,
      // or log it as a warning instead of failing entirely
    }
    try {
      return await this.store(newFile, customPath);
    } catch (error: any) {
      throw new Error(`Failed to replace file: ${error.message}`);
    }
  }
}
