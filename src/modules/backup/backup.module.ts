import { StorageModule } from '@app/shared/services/storage/storage.module';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { BackupController } from './controllers/backup.controller';
import { BackupStorageService } from './services/backup-storage.service';
import { BackupService } from './services/backup.service';

@Module({
  imports: [ScheduleModule.forRoot(), StorageModule],
  controllers: [BackupController],
  providers: [BackupService, BackupStorageService],
  exports: [BackupService],
})
export class BackupModule {}
