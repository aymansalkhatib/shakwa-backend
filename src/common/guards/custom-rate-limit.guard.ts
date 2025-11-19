import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CustomRateLimitService } from '../../shared/services/custom-rate-limit/custom-rate-limit.service';
import {
  CUSTOM_RATE_LIMIT_METADATA_KEY,
  RateLimitOptions,
} from '../decorators/custom-rate-limit.decorator';

/**
 * Guard that enforces custom rate limiting
 * Applies rate limiting to both IP address and email address (OR logic)
 * If either identifier exceeds the limit, the request is blocked
 */
@Injectable()
export class CustomRateLimitGuard implements CanActivate {
  constructor(
    private readonly rateLimitService: CustomRateLimitService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const handler = context.getHandler();

    // Get rate limit options from metadata
    const options = this.reflector.get<RateLimitOptions>(CUSTOM_RATE_LIMIT_METADATA_KEY, handler);

    // If no rate limit is configured, allow the request
    if (!options) {
      return true;
    }

    const { key } = options;

    // Extract identifiers
    const email = this.extractEmail(request);
    const ipAddress = this.extractIpAddress(request);

    // If neither identifier is available, log warning and allow
    if (!email && !ipAddress) {
      return true;
    }

    // Check rate limits for both identifiers (OR logic)
    // If either exceeds the limit, the request is blocked
    const checks: Promise<void>[] = [];

    if (email) {
      const emailKey = `${key}:email:${email.toLowerCase()}`;
      checks.push(this.rateLimitService.check(emailKey));
    }

    if (ipAddress) {
      const ipKey = `${key}:ip:${ipAddress}`;
      checks.push(this.rateLimitService.check(ipKey));
    }

    // Execute all checks in parallel
    // If any check throws, the request is blocked
    try {
      await Promise.all(checks);
      return true;
    } catch (error) {
      // Re-throw HttpException from rate limit service
      if (error instanceof HttpException) {
        throw error;
      }

      return true;
    }
  }

  /**
   * Extracts email address from request body
   */
  private extractEmail(request: Request): string | undefined {
    return request.body?.email;
  }

  /**
   * Extracts IP address from request
   * Handles proxy headers (x-forwarded-for, x-real-ip)
   */
  private extractIpAddress(request: Request): string | undefined {
    // Check x-forwarded-for header (first IP in chain)
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) {
        return firstIp;
      }
    }

    // Check x-real-ip header
    const realIp = request.headers['x-real-ip'] as string;
    if (realIp) {
      return realIp.trim();
    }

    // Fallback to request IP
    return request.ip || request.connection?.remoteAddress || undefined;
  }
}
