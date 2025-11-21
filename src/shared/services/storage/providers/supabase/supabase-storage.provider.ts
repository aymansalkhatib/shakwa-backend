import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AbstractStorageProvider } from '../abstract-storage.provider';
import { StorageOptions, UploadResult } from '../../interfaces/storage-options.interface';
import { EnvironmentConfig } from '../../../../modules/app-config';

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

  async delete(filePath: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucket)
      .remove([this.sanitizePath(filePath)]);

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
