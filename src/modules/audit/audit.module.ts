import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppLoggerModule } from '../../shared/modules/app-logger';
import { AuditController } from './controllers/audit.controller';
import { AuditLogEntity } from './entities/audit-log.entity';
import { AuditService } from './services/audit.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity]), AppLoggerModule],
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
