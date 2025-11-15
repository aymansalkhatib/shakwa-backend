import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { BaseStorageService } from './base-storage.service';
import { SupabaseStorageConfig } from './types';

@Injectable()
export class SupabaseStorageService extends BaseStorageService {
  private readonly BATCH_SIZE = 1000; // Supabase optimal batch size
  private supabase;
  private bucketName: string;

  constructor(private readonly config: SupabaseStorageConfig) {
    super();
    this.supabase = createClient(
      config.SUPABASE_URL,
      config.SUPABASE_SERVICE_ROLE_KEY,
    );
    this.bucketName = config.SUPABASE_BUCKET;
  }

  /**
   * Stores file in Supabase storage
   */
  async store(file: Express.Multer.File, customPath?: string): Promise<string> {
    const storagePath = super.buildStoragePath(
      this.config.BASE_PATH, // Base URL not needed for Supabase
      file.originalname,
      customPath,
    );

    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) throw error;
      return storagePath;
    } catch (error: any) {
      throw new Error(`Failed to store file in Supabase: ${error.message}`);
    }
  }

  /**
   * Retrieves file from Supabase storage
   */
  async retrieve(fileId: string): Promise<Buffer> {
    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .download(fileId);

      if (error) throw error;

      const arrayBuffer = await data.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (error: any) {
      throw new Error(
        `Failed to retrieve file from Supabase: ${error.message}`,
      );
    }
  }

  /**
   * Deletes file from Supabase storage
   */
  async delete(fileId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.storage
        .from(this.bucketName)
        .remove([fileId]);

      if (error) throw error;
      return true;
    } catch (error: any) {
      throw new Error(`Failed to delete file from Supabase: ${error.message}`);
    }
  }

  /**
   * Replaces an existing file with a new one using Supabase upsert
   */
  async replace(
    oldFilePath: string,
    newFile: Express.Multer.File,
    customPath?: string,
  ): Promise<string> {
    const storagePath = customPath || oldFilePath;

    try {
      const { data, error } = await this.supabase.storage
        .from(this.bucketName)
        .upload(storagePath, newFile.buffer, {
          contentType: newFile.mimetype,
          upsert: true,
        });

      if (error) throw error;
      return storagePath;
    } catch (error: any) {
      throw new Error(`Failed to replace file in Supabase: ${error.message}`);
    }
  }

  /**
   * Stores multiple files in Supabase storage using built-in batch operations
   */
  async storeMany(
    files: Express.Multer.File[],
    customPath?: string,
  ): Promise<string[]> {
    return await this.processBatch(files, this.BATCH_SIZE, async (batch) => {
      const uploadPromises = batch.map((file) => {
        const storagePath = super.buildStoragePath(
          '',
          file.originalname,
          customPath,
        );
        return this.supabase.storage
          .from(this.bucketName)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
          })
          .then(({ data, error }) => {
            if (error) throw error;
            return storagePath;
          });
      });

      return await Promise.all(uploadPromises);
    });
  }

  /**
   * Deletes multiple files from Supabase storage using built-in batch operations
   */
  async deleteMany(fileIds: string[]): Promise<boolean[]> {
    return await this.processBatch(fileIds, this.BATCH_SIZE, async (batch) => {
      try {
        const { error } = await this.supabase.storage
          .from(this.bucketName)
          .remove(batch);

        if (error) throw error;
        return batch.map(() => true);
      } catch (error) {
        // If batch operation fails, try individual deletions
        const results = await Promise.all(
          batch.map(async (fileId) => {
            try {
              await this.delete(fileId);
              return true;
            } catch {
              return false;
            }
          }),
        );
        return results;
      }
    });
  }
}
