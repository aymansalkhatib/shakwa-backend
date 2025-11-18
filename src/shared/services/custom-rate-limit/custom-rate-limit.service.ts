import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * Rate limit state stored in Redis
 */
type RateLimitState = {
  timestamps: number[];
};

/**
 * Service for managing custom rate limiting using Redis
 * Implements exponential backoff rate limiting algorithm
 * Each attempt increases the delay before the next attempt is allowed
 */
@Injectable()
export class CustomRateLimitService {
  private readonly logger = new Logger(CustomRateLimitService.name);

  /**
   * Delays in seconds for each attempt count
   * [0, 30s, 5m, 15m, 30m, 1h, 2h, 8h, 24h]
   */
  private readonly delays = [
    0, // First attempt: no delay
    30, // Second attempt: 30 seconds
    5 * 60, // Third attempt: 5 minutes
    15 * 60, // Fourth attempt: 15 minutes
    30 * 60, // Fifth attempt: 30 minutes
    60 * 60, // Sixth attempt: 1 hour
    2 * 60 * 60, // Seventh attempt: 2 hours
    8 * 60 * 60, // Eighth attempt: 8 hours
    24 * 60 * 60, // Ninth+ attempt: 24 hours
  ];

  /**
   * Maximum retention period for timestamps (24 hours in seconds)
   */
  private readonly maxRetentionSeconds = 24 * 60 * 60;

  /**
   * TTL for Redis key (25 hours to ensure cleanup)
   */
  private readonly redisTtlSeconds = 25 * 60 * 60;

  constructor(private readonly redisService: RedisService) {}

  /**
   * Checks if a request should be rate limited
   * Uses exponential backoff: each attempt increases the delay before next attempt
   *
   * @param key - The Redis key for rate limiting
   * @throws HttpException if rate limit is exceeded
   */
  async check(key: string): Promise<void> {
    const now = Math.floor(Date.now() / 1000); // Current time in seconds

    // Get current state from Redis
    const raw = await this.redisService.getString(key);
    const state: RateLimitState = raw ? JSON.parse(raw) : { timestamps: [] };

    // Clean up timestamps older than 24 hours
    state.timestamps = state.timestamps.filter((ts) => now - ts < this.maxRetentionSeconds);

    // Calculate attempt count (number of previous attempts)
    const attemptCount = state.timestamps.length;

    // Get delay for current attempt count
    const delay = this.delays[Math.min(attemptCount, this.delays.length - 1)];

    // Get last attempt timestamp (or 0 if no previous attempts)
    const lastAttempt = state.timestamps[state.timestamps.length - 1] || 0;

    // Calculate when next attempt is allowed
    const nextAllowedTime = lastAttempt + delay;

    // Check if current time is before next allowed time
    if (now < nextAllowedTime) {
      const waitSeconds = nextAllowedTime - now;

      this.logger.warn(
        `Rate limit exceeded for key: ${key}. Attempt #${attemptCount + 1}. Wait ${waitSeconds}s before retrying.`,
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Please wait ${waitSeconds} seconds before retrying.`,
          error: 'Too Many Requests',
          retryAfter: waitSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Add current timestamp to state
    state.timestamps.push(now);

    // Store updated state in Redis with TTL
    await this.redisService.setString(key, JSON.stringify(state), this.redisTtlSeconds);
  }

  /**
   * Resets rate limit for a specific key (useful for testing or manual reset)
   */
  async resetRateLimit(key: string): Promise<void> {
    await this.redisService.delete(key);
    this.logger.log(`Rate limit reset for key: ${key}`);
  }
}
