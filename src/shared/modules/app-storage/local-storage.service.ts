import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { BaseStorageService } from './base-storage.service';
import { LocalStorageConfig } from './types';

@Injectable()
export class LocalStorageService extends BaseStorageService {
  private readonly BATCH_SIZE = 100; // Optimal batch size for local filesystem operations

  constructor(private readonly localConfig?: LocalStorageConfig) {
    super();
  }

  /**
   * Stores file in local filesystem
   */
  async store(
    file: Express.Multer.File,
    name?: string,
    customPath?: string,
  ): Promise<string> {
    let newFilename: any;

    if (name) {
      newFilename = name + '.' + file.originalname.split('.').pop();
    }

    const storagePath = super.buildStoragePath(
      this.localConfig.BASE_PATH,
      newFilename || file.originalname,
      customPath,
    );

    await super.ensureDirectoryExists(path.dirname(storagePath));

    try {
      await fs.writeFile(storagePath, file.buffer);
    } catch (error: any) {
      throw new Error(
        `Failed to store file at ${storagePath}: ${error.message}`,
      );
    }
    return storagePath;
  }

  /**
   * Retrieves file from local filesystem
   */
  async retrieve(fileId: string): Promise<Buffer> {
    const filePath = path.join(this.localConfig.BASE_PATH, fileId);

    try {
      return await fs.readFile(filePath);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to retrieve file: ${error.message}`);
    }
  }

  /**
   * Deletes file from local filesystem
   */
  async delete(fileId: string): Promise<boolean> {
    const filePath = path.join(this.localConfig.BASE_PATH, fileId);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
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
      // Ignore if file doesn't exist
    }
    return await this.store(newFile, customPath);
  }

  /**
   * Stores multiple files in local filesystem using batched operations
   */
  async storeMany(
    files: Express.Multer.File[],
    customPath?: string,
  ): Promise<string[]> {
    return await this.processBatch(files, this.BATCH_SIZE, async (batch) => {
      const promises = batch.map((file) => this.store(file, customPath));
      return await Promise.all(promises);
    });
  }

  /**
   * Deletes multiple files from local filesystem using batched operations
   */
  async deleteMany(fileIds: string[]): Promise<boolean[]> {
    return await this.processBatch(fileIds, this.BATCH_SIZE, async (batch) => {
      const promises = batch.map(async (fileId) => {
        try {
          await this.delete(fileId);
          return true;
        } catch {
          return false;
        }
      });
      return await Promise.all(promises);
    });
  }
}
