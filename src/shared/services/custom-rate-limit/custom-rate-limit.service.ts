// File: custom-rate-limit.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

/**
 * Rate limit state stored in Redis
 */
type RateLimitState = {
  /**
   * List of attempt timestamps (in seconds) within the last 24 hours
   */
  timestamps: number[];

  /**
   * Global lock timestamp (in seconds since epoch).
   * No attempts are allowed while now < blockedUntil,
   * even if timestamps array shrinks when old entries expire.
   */
  blockedUntil?: number;
};

/**
 * Service for managing custom rate limiting using Redis
 * Implements exponential backoff rate limiting algorithm
 * Each attempt increases the delay before the next attempt is allowed
 */
@Injectable()
export class CustomRateLimitService {
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
   * TTL for Redis key (25 hours to ensure the full 24h window is respected)
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
    let state: RateLimitState;

    try {
      state = raw ? (JSON.parse(raw) as RateLimitState) : { timestamps: [] };
    } catch {
      // In case of corrupted state, reset it
      state = { timestamps: [] };
    }

    // Clean up timestamps older than 24 hours (statistical window only)
    state.timestamps = state.timestamps.filter((ts) => now - ts < this.maxRetentionSeconds);

    // If there is a global lock, enforce it first
    if (state.blockedUntil && now < state.blockedUntil) {
      const waitSeconds = state.blockedUntil - now;

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

    // Calculate attempt count (number of previous attempts within 24h window)
    const attemptCount = state.timestamps.length;

    // Get delay for the "next" attempt based on previous attempts count
    const delay = this.delays[Math.min(attemptCount, this.delays.length - 1)];

    // At this point, we allow this attempt (no active global lock)
    // Record current attempt
    state.timestamps.push(now);

    // Compute new blockedUntil (do not shorten an existing lock)
    const newBlockedUntil = now + delay;
    if (!state.blockedUntil || newBlockedUntil > state.blockedUntil) {
      state.blockedUntil = newBlockedUntil;
    }

    // Store updated state in Redis with TTL
    await this.redisService.setString(key, JSON.stringify(state), this.redisTtlSeconds);
  }

  /**
   * Resets rate limit for a specific key (useful for testing or manual reset)
   */
  async resetRateLimit(key: string): Promise<void> {
    await this.redisService.delete(key);
  }
}
