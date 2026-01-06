import { EnvironmentConfig } from '@app/shared/modules/app-config';
import { StorageFileInfo } from '@app/shared/services/storage/interfaces';
import { StorageService } from '@app/shared/services/storage/storage.service';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

/**
 * Dedicated storage service for database backups
 * Uses the shared StorageService wrapper
 */
@Injectable()
export class BackupStorageService {
  private readonly backupFolder: string;

  constructor(
    private readonly storageService: StorageService,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.backupFolder = this.configService.get<string>('BACKUP_STORAGE_FOLDER', 'backups');
  }

  /**
   * Upload backup file to storage
   */
  async uploadBackup(filePath: string, fileName: string): Promise<string> {
    const fileBuffer = fs.readFileSync(filePath);
    const storagePath = `${this.backupFolder}/${fileName}`;

    const result = await this.storageService.upload(fileBuffer, { path: storagePath });
    return result.url;
  }

  /**
   * List all backups from storage
   */
  async listBackups(): Promise<StorageFileInfo[]> {
    const files = await this.storageService.list(this.backupFolder);
    return files.filter((file) => file.name.endsWith('.sql.gz'));
  }

  /**
   * Download backup file from storage
   */
  async downloadBackup(fileName: string, destPath: string): Promise<string> {
    const storagePath = `${this.backupFolder}/${fileName}`;
    const buffer = await this.storageService.download(storagePath);

    fs.writeFileSync(destPath, buffer);
    return destPath;
  }

  /**
   * Delete backup file from storage
   */
  async deleteBackup(fileName: string): Promise<void> {
    const storagePath = `${this.backupFolder}/${fileName}`;
    await this.storageService.delete(storagePath);
  }

  /**
   * Get download URL for a backup (expires in 1 hour)
   */
  async getDownloadUrl(fileName: string): Promise<string> {
    const storagePath = `${this.backupFolder}/${fileName}`;
    return this.storageService.getUrl(storagePath);
  }
}
