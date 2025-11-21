import { Inject, Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FIREBASE_ADMIN } from '../../../notifications/constants/notification.token';
import {
  MultiDeleteOptions,
  MultiUploadOptions,
  StorageOptions,
  UploadResult,
} from '../../interfaces';
import { AbstractStorageProvider } from '../abstract-storage.provider';

@Injectable()
export class FirebaseStorageProvider extends AbstractStorageProvider {
  private readonly bucket: any; // admin.storage.Bucket

  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseApp: admin.app.App) {
    super();
    this.bucket = this.firebaseApp.storage().bucket();
  }

  async upload(file: Buffer, options: StorageOptions): Promise<UploadResult> {
    this.validateFile(file, options);
    const filePath = this.sanitizePath(options.path);
    const fileRef = this.bucket.file(filePath);

    try {
      await fileRef.save(file, {
        contentType: options.mimeType,
        public: true, // Make file public by default, or configure based on options
      });

      return {
        url: await this.getUrl(filePath),
        path: filePath,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized batch upload for Firebase using concurrent uploads
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
    try {
      await this.bucket.file(this.sanitizePath(filePath)).delete();
    } catch (error) {
      throw error;
    }
  }

  /**
   * Optimized batch delete for Firebase using concurrent deletions
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
    const fileRef = this.bucket.file(this.sanitizePath(filePath));
    return `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
  }
}
