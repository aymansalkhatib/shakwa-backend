/**
 * Health Check Controller
 * =======================
 * Provides health check endpoints for Kubernetes probes:
 * - /api/health - Basic health check (liveness)
 * - /api/health/ready - Readiness check (includes dependencies)
 * - /api/health/live - Liveness check (basic)
 *
 * Used by:
 * - Kubernetes liveness probe
 * - Kubernetes readiness probe
 * - Load balancer health checks
 */

import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  /**
   * Basic health check - used by liveness probe
   * Returns 200 if the application is running
   */
  @Get()
  @HealthCheck()
  check() {
    return this.health.check([]);
  }

  /**
   * Liveness probe endpoint
   * Returns 200 if the application process is alive
   */
  @Get('live')
  @HealthCheck()
  live() {
    return this.health.check([]);
  }

  /**
   * Readiness probe endpoint
   * Returns 200 only if all dependencies are ready
   * Includes: Database connection
   */
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      // Check database connection
      () => this.db.pingCheck('database'),
    ]);
  }
}
