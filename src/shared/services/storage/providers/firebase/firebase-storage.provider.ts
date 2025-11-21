import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AbstractStorageProvider } from '../abstract-storage.provider';
import { StorageOptions, UploadResult } from '../../interfaces/storage-options.interface';
import { FIREBASE_ADMIN } from '../../../notifications/constants/notification.token';

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

  async delete(filePath: string): Promise<void> {
    try {
      await this.bucket.file(this.sanitizePath(filePath)).delete();
    } catch (error) {
      throw error;
    }
  }

  async getUrl(filePath: string): Promise<string> {
    const fileRef = this.bucket.file(this.sanitizePath(filePath));
    return `https://storage.googleapis.com/${this.bucket.name}/${filePath}`;
  }
}
