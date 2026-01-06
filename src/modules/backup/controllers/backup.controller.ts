import { Protected } from '@app/common/decorators/protected.decorator';
import { Role } from '@app/common/enums/role.enum';
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { BackupService } from '../services/backup.service';

@Controller('backups')
@Protected(Role.ADMIN)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  /**
   * Get backup system status
   * GET /api/v1/backups/status
   */
  @Get('status')
  getStatus() {
    return {
      status: 'ok',
      ...this.backupService.getStatus(),
      schedule: 'Every 7 days at 2:00 AM',
    };
  }

  /**
   * List all available backups
   * GET /api/v1/backups
   */
  @Get()
  async listBackups() {
    const backups = await this.backupService.listBackups();
    return {
      count: backups.length,
      backups: backups.map((b) => ({
        ...b,
        sizeFormatted: this.formatBytes(b.size),
      })),
    };
  }

  /**
   * Create immediate backup
   * POST /api/v1/backups
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBackup() {
    const result = await this.backupService.createBackup();
    return {
      message: 'Backup created successfully',
      ...result,
      sizeFormatted: this.formatBytes(result.size),
      durationFormatted: `${(result.duration / 1000).toFixed(2)}s`,
    };
  }

  /**
   * Restore from a specific backup
   * POST /api/v1/backups/:fileName/restore
   */
  @Post(':fileName/restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Param('fileName') fileName: string) {
    const result = await this.backupService.restoreBackup(fileName);
    return {
      message: 'Database restored successfully',
      ...result,
      durationFormatted: `${(result.duration / 1000).toFixed(2)}s`,
    };
  }

  /**
   * Get download URL for a backup
   * GET /api/v1/backups/:fileName/download
   */
  @Get(':fileName/download')
  async getDownloadUrl(@Param('fileName') fileName: string) {
    const url = await this.backupService.getBackupDownloadUrl(fileName);
    return {
      fileName,
      downloadUrl: url,
      expiresIn: '1 hour',
    };
  }

  /**
   * Delete a specific backup
   * DELETE /api/v1/backups/:fileName
   */
  @Delete(':fileName')
  @HttpCode(HttpStatus.OK)
  async deleteBackup(@Param('fileName') fileName: string) {
    await this.backupService.deleteBackup(fileName);
    return {
      message: 'Backup deleted successfully',
      fileName,
    };
  }

  /**
   * Clean old backups (keep last N)
   * POST /api/v1/backups/cleanup/:keepCount
   */
  @Post('cleanup/:keepCount')
  @HttpCode(HttpStatus.OK)
  async cleanupBackups(@Param('keepCount') keepCount: string) {
    const count = parseInt(keepCount, 10) || 10;
    const deleted = await this.backupService.cleanOldBackups(count);
    return {
      message: `Cleanup completed`,
      deletedCount: deleted,
      keptCount: count,
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
