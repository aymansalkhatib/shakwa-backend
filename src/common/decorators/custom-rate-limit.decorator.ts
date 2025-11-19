// File: custom-rate-limit.decorator.ts
import { SetMetadata, UseGuards, applyDecorators } from '@nestjs/common';
import { CustomRateLimitGuard } from '../guards/custom-rate-limit.guard';

export const CUSTOM_RATE_LIMIT_METADATA_KEY = 'custom_rate_limit';

/**
 * Enum for rate limit keys
 * Each key represents a specific type of operation
 */
export enum RateLimitKey {
  EMAIL_VERIFICATION = 'email:verification',
  PASSWORD_RESET = 'email:password:reset',
}

/**
 * Configuration options for custom rate limiting
 * Uses exponential backoff: each attempt increases the delay before next attempt
 * Delays: [0s, 30s, 5m, 15m, 30m, 1h, 2h, 8h, 24h]
 */
export interface RateLimitOptions {
  /**
   * The rate limit key identifying the type of operation
   */
  key: RateLimitKey;
}

/**
 * Decorator to attach custom rate limit metadata to a route handler.
 * Only sets metadata; the actual enforcement is handled by CustomRateLimitGuard.
 */
export const CustomRateLimit = (options: RateLimitOptions): MethodDecorator =>
  SetMetadata(CUSTOM_RATE_LIMIT_METADATA_KEY, options);

/**
 * Combines:
 * - UseGuards(CustomRateLimitGuard)
 * - CustomRateLimit({ key })
 *
 * Usage:
 * @RateLimited(RateLimitKey.EMAIL_VERIFICATION)
 */
export const RateLimited = (key: RateLimitKey): MethodDecorator =>
  applyDecorators(UseGuards(CustomRateLimitGuard), CustomRateLimit({ key }));

/**
 * Shortcut decorator for email verification rate limiting.
 *
 * Usage:
 * @EmailVerificationRateLimit()
 */
export const EmailVerificationRateLimit = (): MethodDecorator =>
  RateLimited(RateLimitKey.EMAIL_VERIFICATION);

/**
 * Shortcut decorator for password reset rate limiting.
 *
 * Usage:
 * @PasswordResetRateLimit()
 */
export const PasswordResetRateLimit = (): MethodDecorator =>
  RateLimited(RateLimitKey.PASSWORD_RESET);
