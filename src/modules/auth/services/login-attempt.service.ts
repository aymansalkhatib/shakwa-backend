// File: login-attempt.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { RedisService } from '../../../shared/services/redis';

export interface LoginAttemptOptions {
  key: string;
  maxAttempts: number;
  blockSeconds: number;
  windowSeconds: number;
}

type FailState = {
  count: number;
  blockedUntil?: number;
};

@Injectable()
export class LoginAttemptService {
  constructor(private readonly redis: RedisService) {}

  async checkBlocked(options: LoginAttemptOptions): Promise<void> {
    const { key } = options;

    const now = Math.floor(Date.now() / 1000);
    const raw = await this.redis.getString(key);

    if (!raw) return;

    let state: FailState;

    try {
      state = JSON.parse(raw);
    } catch {
      return;
    }

    if (state.blockedUntil && now < state.blockedUntil) {
      throw new UnauthorizedException(`Too many attempts. Try again later.`);
    }
  }

  async registerFailure(options: LoginAttemptOptions): Promise<void> {
    const { key, maxAttempts, blockSeconds, windowSeconds } = options;

    const now = Math.floor(Date.now() / 1000);

    const raw = await this.redis.getString(key);
    let state: FailState = { count: 0 };

    try {
      if (raw) state = JSON.parse(raw);
    } catch {
      state = { count: 0 };
    }

    if (state.blockedUntil && now < state.blockedUntil) {
      throw new UnauthorizedException(`Too many attempts. Try again later.`);
    }

    state.count = (state.count || 0) + 1;

    if (state.count >= maxAttempts) {
      const blockedUntil = now + blockSeconds;
      const newState: FailState = { count: 0, blockedUntil };

      await this.redis.setString(key, JSON.stringify(newState), blockSeconds);

      throw new UnauthorizedException(`Too many attempts. Try again later.`);
    }

    await this.redis.setString(key, JSON.stringify(state), windowSeconds);
  }

  async resetFailures(key: string): Promise<void> {
    await this.redis.delete(key);
  }
}
