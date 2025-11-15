import { ExecutionContext, Injectable } from '@nestjs/common';
import { InjectThrottlerOptions, InjectThrottlerStorage, ThrottlerException, ThrottlerGuard, ThrottlerModuleOptions } from '@nestjs/throttler';
import type { Request as ExpressRequest } from 'express';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';
import { Reflector } from '@nestjs/core';

@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions()
    protected readonly options: ThrottlerModuleOptions,
    @InjectThrottlerStorage()
    protected readonly storageService: any,
    protected readonly reflector: Reflector,
    private readonly translateHelper: TranslateHelper,
  ) {
    super(options, storageService, reflector);
  }

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

    const user: any = (req as any).user;

    const userId = user?.id ?? user?.userId ?? user?.sub;

    if (userId) {
      return `${ip}:user:${userId}`;
    }

    return ip;
  }

  protected override throwThrottlingException(_: ExecutionContext): never {
    throw new ThrottlerException(this.translateHelper.tr('guards.errors.too_many_requests'));
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
