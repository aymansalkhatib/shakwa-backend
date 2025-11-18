import { SetMetadata } from '@nestjs/common';

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
 * Decorator to apply custom rate limiting to a route handler
 * Rate limiting is applied to both IP address and email address (OR logic)
 * Uses exponential backoff algorithm: each attempt increases the delay
 *
 * @example
 * ```typescript
 * @Post('send-verification-email')
 * @CustomRateLimit({
 *   key: RateLimitKey.EMAIL_VERIFICATION
 * })
 * async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
 *   // ...
 * }
 * ```
 */
export const CustomRateLimit = (options: RateLimitOptions): MethodDecorator =>
  SetMetadata(CUSTOM_RATE_LIMIT_METADATA_KEY, options);
