import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { RedisService } from '../../../shared/services/redis/redis.service';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
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
    const tags = this.generateTags(url);

    try {
      // Try to get from cache
      const cachedData = await this.redisService.getJson(cacheKey);

      if (cachedData) {
        return of(cachedData);
      }

      // If not in cache, execute request and cache the result
      return next.handle().pipe(
        tap(async (data) => {
          await this.redisService.setJson(cacheKey, data, this.defaultTTL, tags);
        }),
      );
    } catch (error) {
      return next.handle();
    }
  }

  private generateCacheKey(url: string, query: any, userId?: number): string {
    const queryString = JSON.stringify(query || {});
    const userPart = userId ? `:user:${userId}` : '';
    return `cache:your-bucket-name:${url}${userPart}:${Buffer.from(queryString).toString('base64')}`;
  }

  private generateTags(url: string): string[] {
    const path = url.split('?')[0];

    // Check if it's a detail request (ends with a number)
    // Regex: /your-bucket-name/123
    const detailMatch = path.match(/\/your-bucket-name\/(\d+)$/);

    if (detailMatch) {
      return [`complaint:${detailMatch[1]}`, 'your-bucket-name:details'];
    }

    // Default to list tag for other complaint requests
    return ['your-bucket-name:list'];
  }
}
