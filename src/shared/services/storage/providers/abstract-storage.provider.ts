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
  abstract uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]>;
  abstract delete(path: string): Promise<void>;
  abstract getUrl(path: string): Promise<string>;
  abstract deleteMultiple(options: MultiDeleteOptions): Promise<void>;
  abstract exists(path: string): Promise<boolean>;

  protected validateFile(file: Buffer): void {
    if (!file || file.length === 0) {
      throw new BadRequestException('File content is empty');
    }
  }

  protected sanitizePath(path: string): string {
    return path.replace(/^\/+/, '').replace(/\/+$/, '');
  }

  /**
   * Default implementation for getting multiple URLs
   * Concrete providers can override this for optimized batch operations
   */
  async getUrls(paths: string[]): Promise<string[]> {
    const results = await Promise.allSettled(paths.map((path) => this.getUrl(path)));
    return results
      .filter((result): result is PromiseFulfilledResult<string> => result.status === 'fulfilled')
      .map((result) => result.value);
  }
}
