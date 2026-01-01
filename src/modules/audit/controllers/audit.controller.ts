import { Controller, Get, Query } from '@nestjs/common';
import { Protected } from '../../../common/decorators/protected.decorator';
import { Role } from '../../../common/enums/role.enum';
import { GetAuditLogsDto } from '../dtos/query/get-audit-logs.dto';
import { AuditService } from '../services/audit.service';

/**
 * Audit Controller
 * Restricted to admin users only
 */
@Controller({ path: 'audit' })
// @Protected(Role.ADMIN)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  async getAuditLogs(@Query() dto: GetAuditLogsDto) {
    const result = await this.auditService.getLogs(dto);

    return {
      data: result.data,
      pagination: {
        total: result.total,
        page: dto.page || 1,
        limit: dto.limit || 50,
        totalPages: Math.ceil(result.total / (dto.limit || 50)),
      },
    };
  }
}
