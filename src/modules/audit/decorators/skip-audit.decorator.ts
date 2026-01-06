import { SetMetadata } from '@nestjs/common';

export const SKIP_AUDIT_KEY = 'skipAudit';

/**
 * Decorator to skip audit logging for specific endpoints
 * Use on controller class or individual methods
 *
 * @example
 * @SkipAudit()
 * @Get('health')
 * healthCheck() { ... }
 */
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
