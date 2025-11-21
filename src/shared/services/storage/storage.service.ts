import { Inject, Injectable } from '@nestjs/common';
import { IStorageProvider, STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { StorageOptions, UploadResult } from './interfaces/storage-options.interface';

@Injectable()
export class StorageService {
  constructor(@Inject(STORAGE_PROVIDER) private readonly storageProvider: IStorageProvider) {}

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    return this.storageProvider.upload(file, options);
  }

  async delete(path: string): Promise<void> {
    return this.storageProvider.delete(path);
  }

  async getUrl(path: string): Promise<string> {
    return this.storageProvider.getUrl(path);
  }
}
