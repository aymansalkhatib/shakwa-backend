import { Controller, Get, Query } from '@nestjs/common';
import { SkipAudit } from '../decorators/skip-audit.decorator';
import { AuditFilterDto } from '../dtos/audit-filter.dto';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { Role } from '@app/common/enums/role.enum';
import { Protected } from '@app/common/decorators/protected.decorator';

@Controller('audits')
@Protected(Role.ADMIN)
@SkipAudit() // Don't audit the audit endpoints
export class AuditController {
  constructor(private readonly auditLogRepository: AuditLogRepository) {}

  /**
   * Get audit logs with filters
   * GET /api/v1/audits
   */
  @Get()
  async findAll(@Query() filters: AuditFilterDto) {
    const result = await this.auditLogRepository.findWithFilters(filters);
    return result;
  }

  /**
   * Get comprehensive audit statistics
   * GET /api/v1/audits/stats
   */
  @Get('stats')
  async getComprehensiveStats() {
    return this.auditLogRepository.getComprehensiveStats();
  }
}
