// File: redis.service.ts
import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.provider';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  // ==================== Key-Value (String) ====================

  /**
   * Create/Update simple key-value (string)
   */
  async setString(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (ttlSeconds && ttlSeconds > 0) {
      return this.redis.setex(key, ttlSeconds, value);
    }
    return this.redis.set(key, value);
  }

  /**
   * Read simple key-value
   */
  async getString(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /**
   * Delete key
   */
  async delete(key: string): Promise<number> {
    return this.redis.del(key);
  }

  async deletePattern(pattern: string): Promise<number> {
    const keys = await this.redis.keys(pattern);
    if (keys.length === 0) return 0;
    return this.redis.del(...keys);
  }

  // ==================== Key JSON ====================

  /**
   * Create/Update JSON value with optional tags for invalidation
   */
  async setJson<T>(key: string, value: T, ttlSeconds?: number, tags: string[] = []): Promise<'OK'> {
    const payload = JSON.stringify(value);

    // 1. Set the actual key-value
    if (ttlSeconds && ttlSeconds > 0) {
      await this.redis.setex(key, ttlSeconds, payload);
    } else {
      await this.redis.set(key, payload);
    }

    // 2. Associate key with tags
    if (tags.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const tag of tags) {
        pipeline.sadd(`tag:${tag}`, key);
        // Optional: Set TTL for tag set to prevent infinite growth?
        // For now, we assume tags are relatively stable or manually cleared.
      }
      await pipeline.exec();
    }

    return 'OK';
  }

  /**
   * Invalidate keys associated with specific tags
   */
  async invalidateTags(tags: string[]): Promise<void> {
    if (tags.length === 0) return;

    for (const tag of tags) {
      const tagKey = `tag:${tag}`;

      // 1. Get all keys associated with this tag
      const keys = await this.redis.smembers(tagKey);

      if (keys.length > 0) {
        // 2. Delete all those keys
        await this.redis.del(...keys);
      }

      // 3. Delete the tag set itself
      await this.redis.del(tagKey);
    }
  }

  /**
   * Read JSON value
   */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.redis.get(key);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as T;
    } catch (error) {
      this.logger.warn(`Failed to parse JSON for key "${key}", returning null.`);
      return null;
    }
  }

  // ==================== Distributed Lock (Lock / Unlock) ====================

  /**
   * Try to acquire a lock with a specified key for ttlSeconds.
   * Returns a random value stored in the lock if successful, or null if it is already locked.
   * The same value must be used in releaseLock.
   */
  async acquireLock(key: string, ttlSeconds: number): Promise<string | null> {
    const value = `${Date.now()}-${Math.random()}`;
    const result = await this.redis.set(
      key,
      value,
      'EX',
      ttlSeconds,
      'NX', // Do not create the key if it already exists
    );
    if (result === 'OK') {
      return value;
    }
    return null;
  }

  /**
   * Release the lock safely (ensures the value is the same as the lock)
   */
  async releaseLock(key: string, value: string): Promise<boolean> {
    const script = `
      if redis.call("GET", KEYS[1]) == ARGV[1] then
        return redis.call("DEL", KEYS[1])
      else
        return 0
      end
    `;

    const result = await this.redis.eval(script, 1, key, value);
    return result === 1;
  }

  // ==================== Delete All Keys ====================

  /**
   * Delete all keys in the current Redis (dangerous – used only in dev / tests)
   */
  async flushAll(): Promise<'OK'> {
    this.logger.warn('FLUSHALL called - all keys in Redis will be deleted!');
    return this.redis.flushall();
  }
}
