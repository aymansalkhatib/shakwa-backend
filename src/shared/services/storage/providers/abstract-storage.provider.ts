import { BadRequestException } from '@nestjs/common';
import {
  MultiDeleteOptions,
  MultiUploadOptions,
  StorageOptions,
  UploadResult,
} from '../interfaces';
import { IStorageProvider } from '../interfaces/storage-provider.interface';

export abstract class AbstractStorageProvider implements IStorageProvider {
  abstract upload(file: Buffer, options: StorageOptions): Promise<UploadResult>;
  abstract delete(path: string): Promise<void>;
  abstract getUrl(path: string): Promise<string>;

  /**
   * Default implementation for uploading multiple files
   * Concrete providers can override this for optimized batch operations
   */
  async uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const fileOptions of options.files) {
      const result = await this.upload(fileOptions.file, {
        path: fileOptions.path,
        mimeType: fileOptions.mimeType,
        maxSize: options.maxSize,
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Default implementation for deleting multiple files
   * Concrete providers can override this for optimized batch operations
   */
  async deleteMultiple(options: MultiDeleteOptions): Promise<void> {
    for (const filePath of options.paths) {
      await this.delete(filePath);
    }
  }

  protected validateFile(file: Buffer, options: StorageOptions): void {
    if (!file || file.length === 0) {
      throw new BadRequestException('File content is empty');
    }

    if (options.maxSize && file.length > options.maxSize) {
      throw new BadRequestException(`File size exceeds limit of ${options.maxSize} bytes`);
    }
  }

  protected sanitizePath(path: string): string {
    return path.replace(/^\/+/, '').replace(/\/+$/, '');
  }
}
