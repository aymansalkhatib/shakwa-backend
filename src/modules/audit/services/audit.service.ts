import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppLogger } from '../../../shared/modules/app-logger';
import { CreateAuditLogDto } from '../dtos/request/create-audit-log.dto';
import { GetAuditLogsDto } from '../dtos/query/get-audit-logs.dto';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
    private readonly logger: AppLogger,
  ) {}

  /**
   * Save audit log to database
   */
  async saveLog(data: CreateAuditLogDto): Promise<void> {
    try {
      const auditLog = this.auditLogRepository.create({
        userId: data.userId || null,
        userType: data.userType || 'anonymous',
        method: data.method,
        url: data.url,
        action: data.action || `${data.method} ${data.url}`,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        statusCode: data.statusCode,
        responseTime: data.responseTime,
        requestBody: data.requestBody,
        queryParams: data.queryParams,
        metadata: data.metadata,
        timestamp: new Date(),
      });

      await this.auditLogRepository.save(auditLog);
    } catch (error) {
      // Log error but don't throw to avoid breaking the request
      this.logger.error(
        'Failed to save audit log',
        error instanceof Error ? error.stack : String(error),
        'AuditService',
      );
    }
  }

  /**
   * Get audit logs with pagination and filters
   */
  async getLogs(dto: GetAuditLogsDto): Promise<{ data: AuditLogEntity[]; total: number }> {
    const { page = 1, limit = 50, userId, userType, method, startDate, endDate } = dto;

    const query = this.auditLogRepository.createQueryBuilder('audit');

    if (userId) {
      query.andWhere('audit.userId = :userId', { userId });
    }

    if (userType) {
      query.andWhere('audit.userType = :userType', { userType });
    }

    if (method) {
      query.andWhere('audit.method = :method', { method });
    }

    if (startDate) {
      query.andWhere('audit.timestamp >= :startDate', { startDate: new Date(startDate) });
    }

    if (endDate) {
      query.andWhere('audit.timestamp <= :endDate', { endDate: new Date(endDate) });
    }

    query.orderBy('audit.timestamp', 'DESC');
    query.skip((page - 1) * limit);
    query.take(limit);

    const [data, total] = await query.getManyAndCount();

    return { data, total };
  }
}
