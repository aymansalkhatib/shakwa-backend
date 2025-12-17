/**
 * Health Module
 * =============
 * Provides health check endpoints for Kubernetes probes.
 *
 * Endpoints:
 * - GET /api/health - Basic health check
 * - GET /api/health/live - Liveness probe
 * - GET /api/health/ready - Readiness probe (checks DB)
 *
 * Dependencies:
 * - @nestjs/terminus (already installed)
 */

import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
