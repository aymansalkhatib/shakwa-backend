import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EnvironmentConfig } from '../../../../modules/app-config';
import {
  MultiDeleteOptions,
  MultiUploadOptions,
  StorageOptions,
  UploadResult,
} from '../../interfaces';
import { AbstractStorageProvider } from '../abstract-storage.provider';

@Injectable()
export class LocalStorageProvider extends AbstractStorageProvider {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    this.basePath = this.configService.getOrThrow<string>('BASE_PATH');
  }

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    this.validateFile(file);

    const relativePath = this.sanitizePath(options.path);
    const fullPath = path.join(this.basePath, relativePath);
    const dir = path.dirname(fullPath);

    try {
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(fullPath, file);

      return {
        url: await this.getUrl(relativePath),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized batch upload for local storage using concurrent writes
   */
  async uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]> {
    // Create all necessary directories first
    const directories = new Set(
      options.files.map((f) => path.dirname(path.join(this.basePath, this.sanitizePath(f.path)))),
    );

    await Promise.all(Array.from(directories).map((dir) => fs.mkdir(dir, { recursive: true })));

    // Upload all files concurrently
    return Promise.all(
      options.files.map((fileOptions) =>
        this.upload(fileOptions.file, {
          path: fileOptions.path,
        }),
      ),
    );
  }

  async delete(filePath: string): Promise<void> {
    const fullPath = path.join(this.basePath, this.sanitizePath(filePath));
    try {
      console.log(filePath);
      await fs.unlink(fullPath);
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Optimized batch delete for local storage using concurrent deletions
   */
  async deleteMultiple(options: MultiDeleteOptions): Promise<void> {
    await Promise.all(
      options.paths.map((filePath) =>
        this.delete(filePath).catch(() => {
          // Ignore errors for individual file deletions
        }),
      ),
    );
  }

  async getUrl(filePath: string): Promise<string> {
    // In a real app, this would return a public URL served by a static file server or controller
    // For now, we return the relative path which can be used to construct the URL
    const fullPath = path.join(this.basePath, filePath);
    return fullPath;
  }

  async exists(filePath: string): Promise<boolean> {
    const fullPath = path.join(this.basePath, this.sanitizePath(filePath));
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
