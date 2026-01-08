import { EnvironmentConfig } from '@app/shared/modules/app-config';
import { StorageFileInfo } from '@app/shared/services/storage/interfaces';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import * as zlib from 'zlib';
import { BackupStorageService } from './backup-storage.service';

const execAsync = promisify(exec);

@Injectable()
export class BackupService {
  private readonly tempDir: string;
  private isBackupRunning = false;
  private isRestoreRunning = false;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly storageService: BackupStorageService,
  ) {
    this.tempDir = path.join(process.cwd(), 'temp', 'backups');
    this.ensureTempDir();
  }

  private ensureTempDir(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  private getDbConfig() {
    return {
      host: this.configService.get<string>('POSTGRES_HOST', 'localhost'),
      port: this.configService.get<number>('POSTGRES_PORT', 5432),
      database: this.configService.get<string>('POSTGRES_DATABASE'),
      username: this.configService.get<string>('POSTGRES_USER'),
      password: this.configService.get<string>('POSTGRES_PASSWORD'),
    };
  }

  private generateBackupFileName(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dbName = this.getDbConfig().database;
    return `${dbName}_${timestamp}.sql.gz`;
  }

  /**
   * Scheduled backup - runs every 7 days at 2:00 AM
   */
  @Cron('0 2 */7 * *') // Every 7 days at 2:00 AM
  async scheduledBackup(): Promise<void> {
    try {
      await this.createBackup();
      // Clean old backups (keep last 10)
      await this.cleanOldBackups(10);
    } catch (error) {
      //
    }
  }

  /**
   * Create a full database backup
   */
  async createBackup(): Promise<any> {
    if (this.isBackupRunning) {
      throw new BadRequestException('A backup is already in progress');
    }

    this.isBackupRunning = true;
    const startTime = Date.now();
    const fileName = this.generateBackupFileName();
    const sqlFilePath = path.join(this.tempDir, fileName.replace('.gz', ''));
    const gzFilePath = path.join(this.tempDir, fileName);

    try {
      const db = this.getDbConfig();

      // Set PGPASSWORD environment variable
      const env = { ...process.env, PGPASSWORD: db.password };

      // Create pg_dump command with all safety options
      const pgDumpCmd = [
        'pg_dump',
        `-h ${db.host}`,
        `-p ${db.port}`,
        `-U ${db.username}`,
        `-d ${db.database}`,
        '--format=plain',
        '--no-owner',
        '--no-acl',
        '--clean',
        '--if-exists',
        '--create',
        `--file="${sqlFilePath}"`,
      ].join(' ');

      await execAsync(pgDumpCmd, { env, maxBuffer: 1024 * 1024 * 500 });

      // Compress the backup
      await this.compressFile(sqlFilePath, gzFilePath);

      // Remove uncompressed file
      fs.unlinkSync(sqlFilePath);

      // Get file size
      const stats = fs.statSync(gzFilePath);

      // Upload to Supabase
      const uploadPath = await this.storageService.uploadBackup(gzFilePath, fileName);

      // Clean up local file
      fs.unlinkSync(gzFilePath);

      const duration = Date.now() - startTime;

      return {
        fileName,
        size: stats.size,
        duration,
        uploadedTo: uploadPath,
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      // Cleanup on error
      [sqlFilePath, gzFilePath].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });
      throw error;
    } finally {
      this.isBackupRunning = false;
    }
  }

  /**
   * Restore database from a backup
   */
  async restoreBackup(fileName: string): Promise<any> {
    if (this.isRestoreRunning) {
      throw new BadRequestException('A restore is already in progress');
    }

    if (this.isBackupRunning) {
      throw new BadRequestException('Cannot restore while backup is running');
    }

    this.isRestoreRunning = true;
    const startTime = Date.now();
    const gzFilePath = path.join(this.tempDir, fileName);
    const sqlFilePath = gzFilePath.replace('.gz', '');

    try {
      // Download backup from Supabase
      await this.storageService.downloadBackup(fileName, gzFilePath);

      // Decompress
      await this.decompressFile(gzFilePath, sqlFilePath);

      const db = this.getDbConfig();
      const env = { ...process.env, PGPASSWORD: db.password };

      // Terminate existing connections
      const terminateCmd = [
        'psql',
        `-h ${db.host}`,
        `-p ${db.port}`,
        `-U ${db.username}`,
        `-d postgres`,
        `-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${db.database}' AND pid <> pg_backend_pid();"`,
      ].join(' ');

      try {
        await execAsync(terminateCmd, { env });
      } catch (e) {}

      // Restore using psql
      const restoreCmd = [
        'psql',
        `-h ${db.host}`,
        `-p ${db.port}`,
        `-U ${db.username}`,
        `-d postgres`,
        `-f "${sqlFilePath}"`,
      ].join(' ');

      await execAsync(restoreCmd, { env, maxBuffer: 1024 * 1024 * 500 });

      // Cleanup
      fs.unlinkSync(gzFilePath);
      fs.unlinkSync(sqlFilePath);

      const duration = Date.now() - startTime;

      return {
        fileName,
        duration,
        restoredAt: new Date().toISOString(),
      };
    } catch (error) {
      // Cleanup on error
      [gzFilePath, sqlFilePath].forEach((f) => {
        if (fs.existsSync(f)) fs.unlinkSync(f);
      });

      if (error instanceof Error) {
        throw new BadRequestException(`Restore failed: ${error.message}`);
      } else {
        throw new BadRequestException('Restore failed with unknown error');
      }
    } finally {
      this.isRestoreRunning = false;
    }
  }

  /**
   * List all available backups
   */
  async listBackups(): Promise<StorageFileInfo[]> {
    return this.storageService.listBackups();
  }

  /**
   * Get download URL for a backup
   */
  async getBackupDownloadUrl(fileName: string): Promise<string> {
    try {
      return await this.storageService.getDownloadUrl(fileName);
    } catch (error) {
      throw new BadRequestException('Backup file not found');
    }
  }

  /**
   * Delete a specific backup
   */
  async deleteBackup(fileName: string): Promise<void> {
    return this.storageService.deleteBackup(fileName);
  }

  /**
   * Clean old backups, keeping only the specified number
   */
  async cleanOldBackups(keepCount: number): Promise<number> {
    const backups = await this.listBackups();

    if (backups.length <= keepCount) {
      return 0;
    }

    // Sort by date (newest first) and get ones to delete
    const toDelete = backups
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(keepCount);

    for (const backup of toDelete) {
      await this.deleteBackup(backup.name);
    }

    return toDelete.length;
  }

  /**
   * Get backup status
   */
  getStatus(): { backupRunning: boolean; restoreRunning: boolean } {
    return {
      backupRunning: this.isBackupRunning,
      restoreRunning: this.isRestoreRunning,
    };
  }

  private compressFile(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      const gzip = zlib.createGzip({ level: 9 });

      input.pipe(gzip).pipe(output).on('finish', resolve).on('error', reject);
    });
  }

  private decompressFile(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const input = fs.createReadStream(inputPath);
      const output = fs.createWriteStream(outputPath);
      const gunzip = zlib.createGunzip();

      input.pipe(gunzip).pipe(output).on('finish', resolve).on('error', reject);
    });
  }
}
