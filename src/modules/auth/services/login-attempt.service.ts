import { Injectable, UnauthorizedException } from '@nestjs/common';
import { MailService } from '../../../shared/services/mail';
import { RedisService } from '../../../shared/services/redis';
import { IFailState } from '../interfaces/fail-state.interface';
import { ILoginAttemptOptions } from '../interfaces/login-attempt-options.interface';

@Injectable()
export class LoginAttemptService {
  constructor(
    private readonly redis: RedisService,
    private readonly mailService: MailService,
  ) {}

  async checkBlocked(options: ILoginAttemptOptions): Promise<void> {
    const { key } = options;

    const now = Math.floor(Date.now() / 1000);
    const raw = await this.redis.getString(key);

    if (!raw) return;

    let state: IFailState;

    try {
      state = JSON.parse(raw);
    } catch {
      return;
    }

    if (state.blockedUntil && now < state.blockedUntil) {
      throw new UnauthorizedException(`Too many attempts. Try again later.`);
    }
  }

  async registerFailure(options: ILoginAttemptOptions): Promise<void> {
    const { key, maxAttempts, blockSeconds, windowSeconds, email } = options;

    const now = Math.floor(Date.now() / 1000);

    const raw = await this.redis.getString(key);
    let state: IFailState = { count: 0 };

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
      const newState: IFailState = { count: 0, blockedUntil };

      await this.redis.setString(key, JSON.stringify(newState), blockSeconds);
      this.mailService.sendLoginLockedNotification({
        failedAttempts: state.count,
        ipAddress: options.ipAddress,
        lockDuration: `${(blockSeconds / 3600).toFixed(2)} hours`,
        lockedUntil: new Date((now + blockSeconds) * 1000).toLocaleString(),
        subject: 'Sign-in Temporarily Locked',
        to: email,
      });
      throw new UnauthorizedException(`Too many attempts. Try again later.1`);
    }

    await this.redis.setString(key, JSON.stringify(state), windowSeconds);
  }

  async resetFailures(key: string): Promise<void> {
    await this.redis.delete(key);
  }
}
