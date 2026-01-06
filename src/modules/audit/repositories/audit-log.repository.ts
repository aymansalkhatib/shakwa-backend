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
    this.repository.insert(data).catch((err) => {
      console.error('Failed to save audit log:', err.message);
    });
  }

  async findWithFilters(filters: AuditFilterDto): Promise<PaginationResponseDto<AuditLogEntity>> {
    const { startDate, endDate, search, sortBy, sortOrder, page = 1, limit = 20 } = filters;
    const queryBuilder = this.repository.createQueryBuilder('audit');

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
    if (filters.userId) {
      queryBuilder.andWhere('audit.userId = :userId', { userId: filters.userId });
    }
    if (filters.userType) {
      queryBuilder.andWhere('audit.userType = :userType', { userType: filters.userType });
    }
    if (filters.clientIp) {
      queryBuilder.andWhere('audit.clientIp = :clientIp', { clientIp: filters.clientIp });
    }
    if (filters.deviceType) {
      queryBuilder.andWhere('audit.deviceType = :deviceType', { deviceType: filters.deviceType });
    }
    if (filters.platform) {
      queryBuilder.andWhere('audit.platform = :platform', { platform: filters.platform });
    }
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
    if (filters.traceId) {
      queryBuilder.andWhere('audit.traceId = :traceId', { traceId: filters.traceId });
    }
    if (startDate) {
      queryBuilder.andWhere('audit.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('audit.createdAt <= :endDate', { endDate });
    }
    if (search) {
      queryBuilder.andWhere('(audit.endpoint ILIKE :search OR audit.errorMessage ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    const allowedSortFields = ['createdAt', 'durationMs', 'statusCode'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const safeSortOrder = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`audit.${safeSortBy}`, safeSortOrder);

    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    return paginate(queryBuilder, filters);
  }

  async getComprehensiveStats() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Overview Stats
    const overviewStats = await this.repository
      .createQueryBuilder('audit')
      .select('COUNT(*)', 'total')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .addSelect('MIN(audit.durationMs)', 'minDuration')
      .addSelect('MAX(audit.durationMs)', 'maxDuration')
      .addSelect('SUM(CASE WHEN audit.statusCode < 400 THEN 1 ELSE 0 END)', 'successCount')
      .addSelect('SUM(CASE WHEN audit.statusCode >= 400 THEN 1 ELSE 0 END)', 'errorCount')
      .addSelect('PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY audit.durationMs)', 'p95Duration')
      .getRawOne();

    console.log(overviewStats?.successCount);

    const total = parseInt(overviewStats?.total, 10) || 0;
    const successCount = parseInt(overviewStats?.successCount, 10) || 0;
    const errorCount = parseInt(overviewStats?.errorCount, 10) || 0;

    // Time-based stats helper
    const getTimeStats = async (since: Date) => {
      const result = await this.repository
        .createQueryBuilder('audit')
        .select('COUNT(*)', 'count')
        .addSelect('AVG(audit.durationMs)', 'avgDuration')
        .addSelect('SUM(CASE WHEN audit.statusCode < 400 THEN 1 ELSE 0 END)', 'successCount')
        .where('audit.createdAt >= :since', { since })
        .getRawOne();
      const count = parseInt(result?.count, 10) || 0;
      const success = parseInt(result?.successCount, 10) || 0;
      return {
        count,
        avgDuration: Math.round(parseFloat(result?.avgDuration) || 0),
        successRate: count > 0 ? Math.round((success / count) * 100 * 100) / 100 : 0,
      };
    };

    const [lastHour, last24Hours, last7Days, last30Days] = await Promise.all([
      getTimeStats(oneHourAgo),
      getTimeStats(oneDayAgo),
      getTimeStats(sevenDaysAgo),
      getTimeStats(thirtyDaysAgo),
    ]);

    // Peak hour
    const peakHourResult = await this.repository
      .createQueryBuilder('audit')
      .select('EXTRACT(HOUR FROM audit.createdAt)', 'hour')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :since', { since: thirtyDaysAgo })
      .groupBy('EXTRACT(HOUR FROM audit.createdAt)')
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    // Peak day
    const peakDayResult = await this.repository
      .createQueryBuilder('audit')
      .select("TO_CHAR(audit.createdAt, 'Day')", 'day')
      .addSelect('COUNT(*)', 'count')
      .where('audit.createdAt >= :since', { since: thirtyDaysAgo })
      .groupBy("TO_CHAR(audit.createdAt, 'Day')")
      .orderBy('COUNT(*)', 'DESC')
      .limit(1)
      .getRawOne();

    // Status distribution
    const statusGroupRaw = await this.repository
      .createQueryBuilder('audit')
      .select("CONCAT(FLOOR(audit.statusCode / 100), 'xx')", 'statusGroup')
      .addSelect('COUNT(*)', 'count')
      .groupBy("CONCAT(FLOOR(audit.statusCode / 100), 'xx')")
      .getRawMany();

    const byStatusGroup: Record<string, number> = {};
    statusGroupRaw.forEach((row: { statusGroup: string; count: string }) => {
      byStatusGroup[row.statusGroup] = parseInt(row.count, 10);
    });

    const statusCodeRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.statusCode', 'code')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.statusCode')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const byStatusCode = statusCodeRaw.map((row: { code: number; count: string }) => ({
      code: row.code,
      count: parseInt(row.count, 10),
      percentage: total > 0 ? Math.round((parseInt(row.count, 10) / total) * 100 * 100) / 100 : 0,
    }));

    // Method distribution
    const methodRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.method', 'method')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.method')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();

    const byMethod: Record<string, number> = {};
    methodRaw.forEach((row: { method: string; count: string }) => {
      byMethod[row.method] = parseInt(row.count, 10);
    });

    // Endpoint stats
    const totalEndpointsResult = await this.repository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.endpoint)', 'count')
      .getRawOne();

    const topEndpoints = await this.repository
      .createQueryBuilder('audit')
      .select('audit.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .groupBy('audit.endpoint')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const slowestEndpoints = await this.repository
      .createQueryBuilder('audit')
      .select('audit.endpoint', 'endpoint')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .addSelect('COUNT(*)', 'count')
      .groupBy('audit.endpoint')
      .having('COUNT(*) >= 5')
      .orderBy('AVG(audit.durationMs)', 'DESC')
      .limit(10)
      .getRawMany();

    const mostErrorEndpoints = await this.repository
      .createQueryBuilder('audit')
      .select('audit.endpoint', 'endpoint')
      .addSelect('COUNT(*)', 'totalCount')
      .addSelect('SUM(CASE WHEN audit.statusCode >= 400 THEN 1 ELSE 0 END)', 'errorCount')
      .groupBy('audit.endpoint')
      .having('SUM(CASE WHEN audit.statusCode >= 400 THEN 1 ELSE 0 END) > 0')
      .orderBy('SUM(CASE WHEN audit.statusCode >= 400 THEN 1 ELSE 0 END)', 'DESC')
      .limit(10)
      .getRawMany();

    // User stats
    const uniqueUsersResult = await this.repository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.userId)', 'count')
      .where('audit.userId IS NOT NULL')
      .getRawOne();

    const topUsers = await this.repository
      .createQueryBuilder('audit')
      .select('audit.userId', 'userId')
      .addSelect('COUNT(*)', 'count')
      .where('audit.userId IS NOT NULL')
      .groupBy('audit.userId')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const userTypeRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.userType', 'userType')
      .addSelect('COUNT(*)', 'count')
      .where('audit.userType IS NOT NULL')
      .groupBy('audit.userType')
      .getRawMany();

    const byUserType: Record<string, number> = {};
    userTypeRaw.forEach((row: { userType: string; count: string }) => {
      byUserType[row.userType] = parseInt(row.count, 10);
    });

    // Client stats
    const uniqueIPsResult = await this.repository
      .createQueryBuilder('audit')
      .select('COUNT(DISTINCT audit.clientIp)', 'count')
      .where('audit.clientIp IS NOT NULL')
      .getRawOne();

    const topIPs = await this.repository
      .createQueryBuilder('audit')
      .select('audit.clientIp', 'ip')
      .addSelect('COUNT(*)', 'count')
      .where('audit.clientIp IS NOT NULL')
      .groupBy('audit.clientIp')
      .orderBy('COUNT(*)', 'DESC')
      .limit(10)
      .getRawMany();

    const platformRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.platform', 'platform')
      .addSelect('COUNT(*)', 'count')
      .where('audit.platform IS NOT NULL')
      .groupBy('audit.platform')
      .getRawMany();

    const byPlatform: Record<string, number> = {};
    platformRaw.forEach((row: { platform: string; count: string }) => {
      byPlatform[row.platform] = parseInt(row.count, 10);
    });

    const deviceTypeRaw = await this.repository
      .createQueryBuilder('audit')
      .select('audit.deviceType', 'deviceType')
      .addSelect('COUNT(*)', 'count')
      .where('audit.deviceType IS NOT NULL')
      .groupBy('audit.deviceType')
      .getRawMany();

    const byDeviceType: Record<string, number> = {};
    deviceTypeRaw.forEach((row: { deviceType: string; count: string }) => {
      byDeviceType[row.deviceType] = parseInt(row.count, 10);
    });

    // Performance stats
    const slowRequestsResult = await this.repository
      .createQueryBuilder('audit')
      .select('COUNT(*)', 'count')
      .where('audit.durationMs >= 1000')
      .getRawOne();

    const durationDistribution = await this.repository
      .createQueryBuilder('audit')
      .select('SUM(CASE WHEN audit.durationMs < 100 THEN 1 ELSE 0 END)', 'under100ms')
      .addSelect(
        'SUM(CASE WHEN audit.durationMs >= 100 AND audit.durationMs < 500 THEN 1 ELSE 0 END)',
        'under500ms',
      )
      .addSelect(
        'SUM(CASE WHEN audit.durationMs >= 500 AND audit.durationMs < 1000 THEN 1 ELSE 0 END)',
        'under1s',
      )
      .addSelect(
        'SUM(CASE WHEN audit.durationMs >= 1000 AND audit.durationMs < 5000 THEN 1 ELSE 0 END)',
        'under5s',
      )
      .addSelect('SUM(CASE WHEN audit.durationMs >= 5000 THEN 1 ELSE 0 END)', 'over5s')
      .getRawOne();

    // Recent errors
    const recentErrors = await this.repository
      .createQueryBuilder('audit')
      .select(['audit.endpoint', 'audit.statusCode', 'audit.errorMessage', 'audit.createdAt'])
      .where('audit.statusCode >= 400')
      .orderBy('audit.createdAt', 'DESC')
      .limit(10)
      .getMany();

    // Hourly trend (last 24 hours)
    const hourlyTrend = await this.repository
      .createQueryBuilder('audit')
      .select("TO_CHAR(audit.createdAt, 'YYYY-MM-DD HH24:00')", 'hour')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .where('audit.createdAt >= :since', { since: oneDayAgo })
      .groupBy("TO_CHAR(audit.createdAt, 'YYYY-MM-DD HH24:00')")
      .orderBy("TO_CHAR(audit.createdAt, 'YYYY-MM-DD HH24:00')", 'ASC')
      .getRawMany();

    // Daily trend (last 30 days)
    const dailyTrend = await this.repository
      .createQueryBuilder('audit')
      .select("TO_CHAR(audit.createdAt, 'YYYY-MM-DD')", 'date')
      .addSelect('COUNT(*)', 'count')
      .addSelect('AVG(audit.durationMs)', 'avgDuration')
      .addSelect('SUM(CASE WHEN audit.statusCode < 400 THEN 1 ELSE 0 END)', 'successCount')
      .where('audit.createdAt >= :since', { since: thirtyDaysAgo })
      .groupBy("TO_CHAR(audit.createdAt, 'YYYY-MM-DD')")
      .orderBy("TO_CHAR(audit.createdAt, 'YYYY-MM-DD')", 'ASC')
      .getRawMany();

    // Calculate averages
    const daysSinceFirst = await this.repository
      .createQueryBuilder('audit')
      .select('MIN(audit.createdAt)', 'firstDate')
      .getRawOne();

    const firstDate = daysSinceFirst?.firstDate ? new Date(daysSinceFirst.firstDate) : now;
    const totalDays = Math.max(
      1,
      Math.ceil((now.getTime() - firstDate.getTime()) / (24 * 60 * 60 * 1000)),
    );
    const totalHours = totalDays * 24;
    const slowCount = parseInt(slowRequestsResult?.count, 10) || 0;

    return {
      overview: {
        totalRequests: total,
        successRate: total > 0 ? Math.round((successCount / total) * 100 * 100) / 100 : 0,
        errorRate: total > 0 ? Math.round((errorCount / total) * 100 * 100) / 100 : 0,
        avgDuration: Math.round(parseFloat(overviewStats?.avgDuration) || 0),
        minDuration: parseInt(overviewStats?.minDuration, 10) || 0,
        maxDuration: parseInt(overviewStats?.maxDuration, 10) || 0,
        p95Duration: Math.round(parseFloat(overviewStats?.p95Duration) || 0),
      },
      timeBasedStats: {
        lastHour,
        last24Hours,
        last7Days,
        last30Days,
        avgRequestsPerHour: Math.round((total / totalHours) * 100) / 100,
        avgRequestsPerDay: Math.round((total / totalDays) * 100) / 100,
        peakHour: {
          hour: parseInt(peakHourResult?.hour, 10) || 0,
          count: parseInt(peakHourResult?.count, 10) || 0,
        },
        peakDay: {
          day: peakDayResult?.day?.trim() || 'N/A',
          count: parseInt(peakDayResult?.count, 10) || 0,
        },
      },
      statusDistribution: {
        byStatusGroup,
        byStatusCode,
        successCount,
        clientErrorCount: byStatusGroup['4xx'] || 0,
        serverErrorCount: byStatusGroup['5xx'] || 0,
      },
      methodDistribution: {
        byMethod,
        mostUsedMethod: methodRaw[0]
          ? { method: methodRaw[0].method, count: parseInt(methodRaw[0].count, 10) }
          : { method: 'N/A', count: 0 },
      },
      endpointStats: {
        totalEndpoints: parseInt(totalEndpointsResult?.count, 10) || 0,
        topEndpoints: topEndpoints.map(
          (e: { endpoint: string; count: string; avgDuration: string }) => ({
            endpoint: e.endpoint,
            count: parseInt(e.count, 10),
            avgDuration: Math.round(parseFloat(e.avgDuration)),
          }),
        ),
        slowestEndpoints: slowestEndpoints.map(
          (e: { endpoint: string; avgDuration: string; count: string }) => ({
            endpoint: e.endpoint,
            avgDuration: Math.round(parseFloat(e.avgDuration)),
            count: parseInt(e.count, 10),
          }),
        ),
        mostErrorEndpoints: mostErrorEndpoints.map(
          (e: { endpoint: string; totalCount: string; errorCount: string }) => {
            const totalCount = parseInt(e.totalCount, 10);
            const errCount = parseInt(e.errorCount, 10);
            return {
              endpoint: e.endpoint,
              errorCount: errCount,
              errorRate: totalCount > 0 ? Math.round((errCount / totalCount) * 100 * 100) / 100 : 0,
            };
          },
        ),
      },
      userStats: {
        uniqueUsers: parseInt(uniqueUsersResult?.count, 10) || 0,
        topUsers: topUsers.map((u: { userId: number; count: string }) => ({
          userId: u.userId,
          count: parseInt(u.count, 10),
        })),
        byUserType,
      },
      clientStats: {
        uniqueIPs: parseInt(uniqueIPsResult?.count, 10) || 0,
        topIPs: topIPs.map((ip: { ip: string; count: string }) => ({
          ip: ip.ip,
          count: parseInt(ip.count, 10),
        })),
        byPlatform,
        byDeviceType,
      },
      performanceStats: {
        slowRequestsCount: slowCount,
        slowRequestsPercentage: total > 0 ? Math.round((slowCount / total) * 100 * 100) / 100 : 0,
        durationDistribution: {
          under100ms: parseInt(durationDistribution?.under100ms, 10) || 0,
          under500ms: parseInt(durationDistribution?.under500ms, 10) || 0,
          under1s: parseInt(durationDistribution?.under1s, 10) || 0,
          under5s: parseInt(durationDistribution?.under5s, 10) || 0,
          over5s: parseInt(durationDistribution?.over5s, 10) || 0,
        },
      },
      recentErrors: recentErrors.map((e) => ({
        endpoint: e.endpoint,
        statusCode: e.statusCode,
        errorMessage: e.errorMessage,
        createdAt: e.createdAt,
      })),
      hourlyTrend: hourlyTrend.map((h: { hour: string; count: string; avgDuration: string }) => ({
        hour: h.hour,
        count: parseInt(h.count, 10),
        avgDuration: Math.round(parseFloat(h.avgDuration)),
      })),
      dailyTrend: dailyTrend.map(
        (d: { date: string; count: string; avgDuration: string; successCount: string }) => {
          const count = parseInt(d.count, 10);
          const success = parseInt(d.successCount, 10);
          return {
            date: d.date,
            count,
            avgDuration: Math.round(parseFloat(d.avgDuration)),
            successRate: count > 0 ? Math.round((success / count) * 100 * 100) / 100 : 0,
          };
        },
      ),
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
