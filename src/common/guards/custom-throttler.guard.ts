import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerException, ThrottlerGuard } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(req: ExpressRequest): Promise<string> {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIp = req.headers['x-real-ip'];

    const ipFromForwardedFor =
      typeof forwardedFor === 'string'
        ? forwardedFor.split(',')[0].trim()
        : Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : undefined;

    const rawIp =
      ipFromForwardedFor ||
      (typeof realIp === 'string' ? realIp : undefined) ||
      req.ip ||
      req.socket?.remoteAddress ||
      'unknown';

    const ip = rawIp.startsWith('::ffff:') ? rawIp.substring(7) : rawIp;

    return ip;
  }

  protected override throwThrottlingException(context: ExecutionContext): never {
    throw new ThrottlerException('Too many requests. Please try again later.');
  }

  protected override generateKey(context: ExecutionContext, suffix: string, name: string): string {
    const request = context.switchToHttp().getRequest<ExpressRequest>();

    const rawRoute =
      request.route?.path || (request.url ? request.url.split('?')[0] : 'unknown-route');

    const route = rawRoute || 'unknown-route';

    const safeSuffix = suffix || 'anonymous';

    return `${name}:${route}:${safeSuffix}`;
  }
}
