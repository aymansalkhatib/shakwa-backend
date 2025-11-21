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
