import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AbstractStorageProvider } from '../abstract-storage.provider';
import { StorageOptions, UploadResult } from '../../interfaces/storage-options.interface';
import { EnvironmentConfig } from '../../../../modules/app-config';

@Injectable()
export class LocalStorageProvider extends AbstractStorageProvider {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    this.basePath = this.configService.getOrThrow<string>('BASE_PATH');
  }

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    this.validateFile(file, options);

    const relativePath = this.sanitizePath(options.path);
    const fullPath = path.join(this.basePath, relativePath);
    const dir = path.dirname(fullPath);

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file);

      return {
        url: await this.getUrl(relativePath),
        path: relativePath,
      };
    } catch (error) {
      throw error;
    }
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, this.sanitizePath(filePath));
    try {
      await fs.unlink(fullPath);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async getUrl(filePath: string): Promise<string> {
    // In a real app, this would return a public URL served by a static file server or controller
    // For now, we return the relative path which can be used to construct the URL
    return `/${this.sanitizePath(filePath)}`;
  }
}
