import { StorageOptions, UploadResult } from './storage-options.interface';

export interface IStorageProvider {
  upload(file: Buffer, options: StorageOptions): Promise<UploadResult>;
  delete(path: string): Promise<void>;
  getUrl(path: string): Promise<string>;
}

export const STORAGE_PROVIDER = Symbol('STORAGE_PROVIDER');
