import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../../shared/services/redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  private readonly defaultTTL = 300; // 5 minutes

  constructor(private readonly redisService: RedisService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, query, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Generate cache key from URL, query params, and user ID
    const cacheKey = this.generateCacheKey(url, query, user?.id);

    try {
      // Try to get from cache
      const cachedData = await this.redisService.getJson<any>(cacheKey);

      if (cachedData) {
        this.logger.debug(`Cache HIT: ${cacheKey}`);
        return of(cachedData);
      }

      this.logger.debug(`Cache MISS: ${cacheKey}`);

      // If not in cache, execute request and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          try {
            await this.redisService.setJson(cacheKey, data, this.defaultTTL);
            this.logger.debug(`Cached: ${cacheKey}`);
          } catch (error) {
            this.logger.error(`Failed to cache ${cacheKey}:`, error);
          }
        }),
      );
    } catch (error) {
      this.logger.error(`Cache error for ${cacheKey}:`, error);
      return next.handle();
    }
  }

  private generateCacheKey(url: string, query: any, userId?: number): string {
    const queryString = JSON.stringify(query || {});
    const userPart = userId ? `:user:${userId}` : '';
    return `cache:${url}${userPart}:${Buffer.from(queryString).toString('base64')}`;
  }
}
