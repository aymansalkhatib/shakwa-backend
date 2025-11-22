import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/services/redis/redis.service';

@Injectable()
export class CacheInvalidationService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Invalidate all complaint-related caches
   */
  async invalidateComplaintCaches(complaintId?: number): Promise<void> {
    await this.redisService.deletePattern('cache:your-bucket-name:*');
  }
}
