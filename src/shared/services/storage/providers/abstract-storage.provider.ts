import { BadRequestException } from '@nestjs/common';
import { IStorageProvider } from '../interfaces/storage-provider.interface';
import { StorageOptions, UploadResult } from '../interfaces/storage-options.interface';

export abstract class AbstractStorageProvider implements IStorageProvider {
  abstract upload(file: Buffer, options: StorageOptions): Promise<UploadResult>;
  abstract delete(path: string): Promise<void>;
  abstract getUrl(path: string): Promise<string>;

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
