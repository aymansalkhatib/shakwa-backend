import { PaginationResponseDto } from '@app/common/pagination/dto/pagination-response.dto';
import { paginate } from '@app/common/pagination/paginate.service';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditFilterDto } from '../dtos/audit-filter.dto';
import { AuditLogEntity } from '../entities/audit-log.entity';

@Injectable()
export class AuditLogRepository {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly repository: Repository<AuditLogEntity>,
  ) {}

  async create(data: Partial<AuditLogEntity>): Promise<AuditLogEntity> {
    const auditLog = this.repository.create(data);
    return this.repository.save(auditLog);
  }

  async createAsync(data: Partial<AuditLogEntity>): Promise<void> {
    // Fire and forget - don't block the response
    this.repository.insert(data).catch((err) => {
      console.error('Failed to save audit log:', err.message);
    });
  }

  async findWithFilters(filters: AuditFilterDto): Promise<PaginationResponseDto<AuditLogEntity>> {
    const { startDate, endDate, search, sortBy, sortOrder, page = 1, limit = 20 } = filters;

    const queryBuilder = this.repository.createQueryBuilder('audit');

    // Request Filters
    if (filters.method) {
      queryBuilder.andWhere('audit.method = :method', { method: filters.method });
    }

    if (filters.endpoint) {
      queryBuilder.andWhere('audit.endpoint ILIKE :endpoint', {
        endpoint: `%${filters.endpoint}%`,
      });
    }

    if (filters.statusCode) {
      queryBuilder.andWhere('audit.statusCode = :statusCode', { statusCode: filters.statusCode });
    }

    if (filters.statusGroup) {
      const statusRange = this.getStatusRange(filters.statusGroup);
      queryBuilder.andWhere('audit.statusCode BETWEEN :min AND :max', statusRange);
    }

    // User Filters
    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }

    if (filters.userType) {
      queryBuilder.andWhere('audit.userType = :userType', { userType: filters.userType });
    }

    // Client Filters
    if (filters.clientIp) {
      queryBuilder.andWhere('audit.clientIp = :clientIp', { clientIp: filters.clientIp });
    }

    if (filters.deviceType) {
      queryBuilder.andWhere('audit.deviceType = :deviceType', { deviceType: filters.deviceType });
    }

    if (filters.platform) {
      queryBuilder.andWhere('audit.platform = :platform', { platform: filters.platform });
    }

    // Performance Filters
    if (filters.minDuration !== undefined) {
      queryBuilder.andWhere('audit.durationMs >= :minDuration', {
        minDuration: filters.minDuration,
      });
    }

    if (filters.maxDuration !== undefined) {
      queryBuilder.andWhere('audit.durationMs <= :maxDuration', {
        maxDuration: filters.maxDuration,
      });
    }

    // Tracing
    if (filters.traceId) {
      queryBuilder.andWhere('audit.traceId = :traceId', { traceId: filters.traceId });
    }

    // Date Range
    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    // Search (endpoint or errorMessage)
    if (search) {
      queryBuilder.andWhere('(audit.endpoint ILIKE :search OR audit.errorMessage ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    // Sorting
    const allowedSortFields = ['createdAt', 'durationMs', 'statusCode'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`audit.${safeSortBy}`, safeSortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute
    return paginate(queryBuilder, filters);
  }

  async getStats(
    startDate?: string,
    endDate?: string,
  ): Promise<{
    totalRequests: number;
    successRate: number;
    avgDuration: number;
    byStatus: Record<string, number>;
    byMethod: Record<string, number>;
    slowestEndpoints: { endpoint: string; avgDuration: number }[];
  }> {
    const queryBuilder = this.repository.createQueryBuilder('audit');

    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }

    // Total & Avg Duration
    const stats = await queryBuilder
      .select('COUNT(*)', 'total')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .addSelect('SUM(CASE WHEN audit.statusCode < 400 THEN 1 ELSE 0 END)', 'successCount')
      .getRawOne();

    // By Status Group
    const byStatusRaw = await this.repository
      .createQueryBuilder('audit')
      .select("CONCAT(FLOOR(audit.statusCode / 100), 'xx')", 'statusGroup')
      .addSelect('COUNT(*)', 'count')
      .groupBy('statusGroup')
      .getRawMany();

    const byStatus: Record<string, number> = {};
    byStatusRaw.forEach((row) => {
      byStatus[row.statusGroup] = parseInt(row.count, 10);
    });

    // By Method
    const byMethodRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.method')
      .getRawMany();

    const byMethod: Record<string, number> = {};
    byMethodRaw.forEach((row) => {
      byMethod[row.method] = parseInt(row.count, 10);
    });

    // Slowest Endpoints
    const slowestEndpoints = await this.repository
      .createQueryBuilder('audit')
      .select('audit.endpoint', 'endpoint')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .groupBy('audit.endpoint')
      .orderBy('avgDuration', 'DESC')
      .limit(10)
      .getRawMany();

    const total = parseInt(stats.total, 10) || 0;
    const successCount = parseInt(stats.successCount, 10) || 0;

    return {
      totalRequests: total,
      successRate: total > 0 ? Math.round((successCount / total) * 100 * 100) / 100 : 0,
      avgDuration: Math.round(parseFloat(stats.avgDuration) || 0),
      byStatus,
      byMethod,
      slowestEndpoints: slowestEndpoints.map((e) => ({
        endpoint: e.endpoint,
        avgDuration: Math.round(parseFloat(e.avgDuration)),
      })),
    };
  }

  private getStatusRange(group: string): { min: number; max: number } {
    const ranges: Record<string, { min: number; max: number }> = {
      '2xx': { min: 200, max: 299 },
      '3xx': { min: 300, max: 399 },
      '4xx': { min: 400, max: 499 },
      '5xx': { min: 500, max: 599 },
    };
    return ranges[group] || { min: 0, max: 999 };
  }
}
