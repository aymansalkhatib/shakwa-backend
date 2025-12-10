import { CanActivate, ExecutionContext, HttpException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CustomRateLimitService } from '../../shared/modules/custom-rate-limit';
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

    // If neither identifier is available, allow
    if (!email && !ipAddress) {
      return true;
    }

    // Check rate limits for both identifiers (OR logic)
    // If either exceeds the limit, the request is blocked
    // Use sequential checks to avoid race conditions
    try {
      if (email) {
        const emailKey = `${key}:email:${email.toLowerCase()}`;
        await this.rateLimitService.check(emailKey);
      }

      if (ipAddress) {
        const ipKey = `${key}:ip:${ipAddress}`;
        await this.rateLimitService.check(ipKey);
      }

      return true;
    } catch (error) {
      // Re-throw HttpException from rate limit service
      if (error instanceof HttpException) {
        throw error;
      }

      // For unexpected errors, allow the request
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
   * Validates that IP is not private/local
   */
  private extractIpAddress(request: Request): string | undefined {
    let ip: string | undefined;

    // Check x-forwarded-for header (first IP in chain)
    const forwardedFor = request.headers['x-forwarded-for'] as string;
    if (forwardedFor) {
      const firstIp = forwardedFor.split(',')[0]?.trim();
      if (firstIp) {
        ip = firstIp;
      }
    }

    // Check x-real-ip header
    if (!ip) {
      const realIp = request.headers['x-real-ip'] as string;
      if (realIp) {
        ip = realIp.trim();
      }
    }

    // Fallback to request IP
    if (!ip) {
      ip = request.ip || request.connection?.remoteAddress;
    }

    // Validate IP is public (not private/local)
    if (ip && this.isPublicIp(ip)) {
      return ip;
    }

    return undefined;
  }

  /**
   * Checks if an IP address is public (not private/local)
   */
  private isPublicIp(ip: string): boolean {
    // Remove IPv6 prefix if present
    const cleanIp = ip.replace(/^::ffff:/, '');

    // Check for localhost
    if (cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp === '::1') {
      return false;
    }

    // Check for private IP ranges
    // 10.0.0.0 - 10.255.255.255
    if (cleanIp.startsWith('10.')) {
      return false;
    }

    // 172.16.0.0 - 172.31.255.255
    if (cleanIp.startsWith('172.')) {
      const secondOctet = parseInt(cleanIp.split('.')[1], 10);
      if (secondOctet >= 16 && secondOctet <= 31) {
        return false;
      }
    }

    // 192.168.0.0 - 192.168.255.255
    if (cleanIp.startsWith('192.168.')) {
      return false;
    }

    // 169.254.0.0 - 169.254.255.255 (link-local)
    if (cleanIp.startsWith('169.254.')) {
      return false;
    }

    return true;
  }
}
