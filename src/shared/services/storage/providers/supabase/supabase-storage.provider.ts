import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { EnvironmentConfig } from '../../../../modules/app-config';
import {
  MultiDeleteOptions,
  MultiUploadOptions,
  StorageOptions,
  UploadResult,
} from '../../interfaces';
import { AbstractStorageProvider } from '../abstract-storage.provider';

@Injectable()
export class SupabaseStorageProvider extends AbstractStorageProvider {
  private readonly supabase: SupabaseClient;
  private readonly bucket: string;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    const url = this.configService.getOrThrow<string>('SUPABASE_URL');
    const key = this.configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    this.bucket = this.configService.getOrThrow<string>('SUPABASE_BUCKET');

    this.supabase = createClient(url, key);
  }

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    this.validateFile(file, options);
    const filePath = this.sanitizePath(options.path);

    const { data, error } = await this.supabase.storage.from(this.bucket).upload(filePath, file, {
      contentType: options.mimeType,
      upsert: true,
    });

    if (error) {
      throw error;
    }

    return {
      url: await this.getUrl(filePath),
      path: filePath,
      key: data.path,
    };
  }

  /**
   * Optimized batch upload for Supabase using concurrent uploads
   */
  async uploadMultiple(options: MultiUploadOptions): Promise<UploadResult[]> {
    return Promise.all(
      options.files.map((fileOptions) =>
        this.upload(fileOptions.file, {
          path: fileOptions.path,
          mimeType: fileOptions.mimeType,
          maxSize: options.maxSize,
        }),
      ),
    );
  }

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([this.sanitizePath(filePath)]);

    if (error) {
      throw error;
    }
  }

  /**
   * Optimized batch delete for Supabase using native batch delete API
   */
  async deleteMultiple(options: MultiDeleteOptions): Promise<void> {
    const sanitizedPaths = options.paths.map((p) => this.sanitizePath(p));
    const { error } = await this.supabase.storage.from(this.bucket).remove(sanitizedPaths);

    if (error) {
      throw error;
    }
  }

  async getUrl(filePath: string): Promise<string> {
    const { data } = this.supabase.storage
      .from(this.bucket)
      .getPublicUrl(this.sanitizePath(filePath));

    return data.publicUrl;
  }
}
