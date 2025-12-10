import { Inject, Injectable } from '@nestjs/common';
import { STORAGE_PROVIDER_SERVICE } from './constants/storage.token';
import { MultiDeleteOptions, MultiUploadOptions, UploadResult } from './interfaces';
import { StorageOptions } from './interfaces/storage-options.interface';
import { IStorageProvider } from './interfaces/storage-provider.interface';

@Injectable()
export class StorageService {
  constructor(
    @Inject(STORAGE_PROVIDER_SERVICE) private readonly storageProvider: IStorageProvider,
  ) {}

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    return this.storageProvider.upload(file, options);
  }

  async uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]> {
    return this.storageProvider.uploadMultiple(options);
  }

  async delete(path: string): Promise<void> {
    return this.storageProvider.delete(path);
  }

  async deleteMultiple(options: MultiDeleteOptions): Promise<void> {
    return this.storageProvider.deleteMultiple(options);
  }

  async getUrl(path: string): Promise<string> {
    return this.storageProvider.getUrl(path);
  }

  async getUrls(paths: string[]): Promise<string[]> {
    return this.storageProvider.getUrls(paths);
  }

  async exists(path: string): Promise<boolean> {
    return this.storageProvider.exists(path);
  }
}
