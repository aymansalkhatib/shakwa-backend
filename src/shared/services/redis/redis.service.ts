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
   * Create/Update JSON value
   */
  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<'OK'> {
    const payload = JSON.stringify(value);
    if (ttlSeconds && ttlSeconds > 0) {
      return this.redis.setex(key, ttlSeconds, payload);
    }
    return this.redis.set(key, payload);
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
