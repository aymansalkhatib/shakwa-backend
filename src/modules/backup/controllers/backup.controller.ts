import { Protected } from '@app/common/decorators/protected.decorator';
import { Role } from '@app/common/enums/role.enum';
import { Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { BackupService } from '../services/backup.service';
import { BackupFileNameDto, CleanupBackupsDto } from '../dto';

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
    return await this.backupService.listBackups();
  }

  /**
   * Create immediate backup
   * POST /api/v1/backups
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBackup() {
    return await this.backupService.createBackup();
  }

  /**
   * Restore from a specific backup
   * POST /api/v1/backups/:fileName/restore
   */
  @Post(':fileName/restore')
  @HttpCode(HttpStatus.OK)
  async restoreBackup(@Param() params: BackupFileNameDto) {
    const result = await this.backupService.restoreBackup(params.fileName);
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
  async getDownloadUrl(@Param() params: BackupFileNameDto) {
    const url = await this.backupService.getBackupDownloadUrl(params.fileName);
    return {
      fileName: params.fileName,
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
  async deleteBackup(@Param() params: BackupFileNameDto) {
    await this.backupService.deleteBackup(params.fileName);
    return {
      message: 'Backup deleted successfully',
      fileName: params.fileName,
    };
  }

  /**
   * Clean old backups (keep last N)
   * POST /api/v1/backups/cleanup/:keepCount
   */
  @Post('cleanup/:keepCount')
  @HttpCode(HttpStatus.OK)
  async cleanupBackups(@Param() params: CleanupBackupsDto) {
    const deleted = await this.backupService.cleanOldBackups(params.keepCount);
    return {
      message: `Cleanup completed`,
      deletedCount: deleted,
      keptCount: params.keepCount,
    };
  }
}
