// File: custom-rate-limit.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from '../../services/redis';

export interface RateLimitOptions {
  /**
   * Sliding window size in seconds (e.g. 24 hours).
   * All attempts inside this window are counted together.
   */
  windowSeconds: number;

  /**
   * Number of "free" attempts at the beginning of each window
   * that are allowed with no delay and no lock (e.g. 4 attempts).
   */
  freeAttempts: number;

  /**
   * Number of attempts allowed in each backoff step (after the first window).
   * Example: 2 means only 2 attempts are allowed per backoff stage
   * before a new lock is applied.
   */
  attemptsPerBackoffStep: number;

  /**
   * Base delay (in seconds) for the first lock.
   * Example: 10 * 60 = 10 minutes.
   */
  baseDelaySeconds: number;

  /**
   * Maximum possible delay (ceiling) for any lock in seconds.
   * The exponential backoff will never exceed this value.
   */
  maxDelaySeconds: number;

  /**
   * Exponential factor for backoff growth.
   * Example: 2 means 10m → 20m → 40m → 80m ... up to maxDelaySeconds.
   */
  multiplier: number;
}

/**
 * Rate limit state stored in Redis.
 * This state is keyed by a logical identifier (e.g. "email:foo@bar.com").
 */
type RateLimitState = {
  /**
   * Start timestamp (epoch seconds) of the current window.
   */
  windowStart: number;

  /**
   * Number of attempts performed inside the current window.
   */
  attemptsInWindow: number;

  /**
   * Current backoff level.
   * 0 means no backoff/lock has been applied yet.
   */
  backoffLevel: number;

  /**
   * When a lock is active, this is the timestamp (epoch seconds)
   * at which the lock expires. If undefined, no lock is active.
   */
  blockedUntil?: number;
};

@Injectable()
export class CustomRateLimitService {
  /**
   * Default configuration suitable for email / sensitive operations:
   * - 24h window
   * - first 4 attempts free (no delay)
   * - after a lock, only 2 attempts are allowed per backoff stage
   * - delay starts at 10 minutes and doubles up to 8 hours
   */
  private readonly defaultOptions: RateLimitOptions = {
    windowSeconds: 24 * 60 * 60, // 24 hours
    freeAttempts: 4, // 4 attempts in the first window without delay
    attemptsPerBackoffStep: 2, // 2 attempts per backoff stage
    baseDelaySeconds: 10 * 60, // 10 minutes
    maxDelaySeconds: 8 * 60 * 60, // 8 hours
    multiplier: 2, // exponential growth factor
  };

  constructor(private readonly redisService: RedisService) {}

  /**
   * Check rate limit for a given key.
   *
   * Algorithm:
   * - Use a fixed-length window (e.g. 24h) per key.
   * - Inside the window:
   *   - Allow `freeAttempts` without delay.
   *   - After that, use staged exponential backoff:
   *     - Each backoff level has a small quota (`attemptsPerBackoffStep`).
   *     - When quota for that level is exceeded, a lock is applied.
   * - When window expires, reset all counters/backoff for that key.
   *
   * @param key     Redis key used to track attempts for this identity.
   * @param options Optional configuration override (per use-case).
   *
   * @throws HttpException (429) if the caller is currently locked.
   */
  async check(key: string, options?: Partial<RateLimitOptions>): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    const cfg: RateLimitOptions = { ...this.defaultOptions, ...options };

    const raw = await this.redisService.getString(key);

    let state: RateLimitState;
    try {
      state = raw ? (JSON.parse(raw) as RateLimitState) : this.createInitialState(now);
    } catch {
      // If the stored JSON is corrupted, start clean.
      state = this.createInitialState(now);
    }

    // 1) If the current window has expired, start a fresh window.
    if (now - state.windowStart >= cfg.windowSeconds) {
      state = this.createInitialState(now);
    }

    // 2) If a lock is active, immediately reject.
    if (state.blockedUntil && now < state.blockedUntil) {
      const retryAfter = state.blockedUntil - now;
      throw this.buildException(retryAfter);
    }

    // 3) Free phase: allow up to `freeAttempts` with no delay or lock.
    if (state.attemptsInWindow < cfg.freeAttempts) {
      state.attemptsInWindow += 1;
      await this.saveState(key, state, cfg);
      return;
    }

    /**
     * 4) Backoff phases:
     *
     * Distribution logic:
     * - In the first window:
     *   - First `freeAttempts` (e.g. 4) are allowed freely.
     *   - On the (freeAttempts + 1)-th attempt, we trigger the first lock.
     *
     * - After the first lock (backoffLevel = 1):
     *   - Allow only `attemptsPerBackoffStep` (e.g. 2) attempts.
     *   - After these 2 attempts, trigger a new lock at a higher backoff level.
     *
     * This matches the behavior:
     *   "First window: 4 attempts, then lock, then 2 attempts per lock
     *    for the rest of the window."
     */

    const currentThreshold = cfg.freeAttempts + cfg.attemptsPerBackoffStep * state.backoffLevel;

    if (state.attemptsInWindow < currentThreshold) {
      // Still allowed to perform attempts at this backoff level.
      state.attemptsInWindow += 1;
      await this.saveState(key, state, cfg);
      return;
    }

    // 5) Threshold exceeded → move to the next backoff level and lock.
    const nextLevel = state.backoffLevel + 1;
    const delaySeconds = this.computeDelay(nextLevel, cfg);

    state.backoffLevel = nextLevel;
    state.blockedUntil = now + delaySeconds;

    await this.saveState(key, state, cfg);

    throw this.buildException(delaySeconds);
  }

  /**
   * Completely reset rate limit state for a given key.
   * Useful for tests, admin tools, or instant unlocks.
   */
  async resetRateLimit(key: string): Promise<void> {
    await this.redisService.delete(key);
  }

  /**
   * Create a new empty state starting at the given timestamp.
   */
  private createInitialState(now: number): RateLimitState {
    return {
      windowStart: now,
      attemptsInWindow: 0,
      backoffLevel: 0,
      blockedUntil: undefined,
    };
  }

  /**
   * Compute exponential backoff delay for the given level.
   *
   * Level mapping:
   *   level = 1 → baseDelay
   *   level = 2 → baseDelay * multiplier
   *   level = 3 → baseDelay * multiplier^2
   *   ...
   *
   * The final delay is clamped to `maxDelaySeconds`.
   */
  private computeDelay(level: number, cfg: RateLimitOptions): number {
    const exponent = Math.max(level - 1, 0);
    const raw = cfg.baseDelaySeconds * Math.pow(cfg.multiplier, exponent);

    return Math.min(raw, cfg.maxDelaySeconds);
  }

  /**
   * Persist state to Redis with a dynamic TTL.
   * TTL is large enough to cover:
   *   - the whole window
   *   - the maximum possible lock
   *   - plus a small safety margin
   */
  private async saveState(
    key: string,
    state: RateLimitState,
    cfg: RateLimitOptions,
  ): Promise<void> {
    const ttl = cfg.windowSeconds + cfg.maxDelaySeconds + 60; // safety margin of 60 seconds
    await this.redisService.setString(key, JSON.stringify(state), ttl);
  }

  /**
   * Build the HTTP 429 exception with a Retry-After payload.
   */
  private buildException(retryAfter: number): HttpException {
    return new HttpException(
      {
        statusCode: HttpStatus.TOO_MANY_REQUESTS,
        message: `Please wait ${retryAfter} seconds before retrying.`,
        error: 'Too Many Requests',
        retryAfter,
      },
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
