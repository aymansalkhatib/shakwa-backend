import { Injectable } from '@nestjs/common';
import { RedisService } from '../../../shared/services/redis/redis.service';

@Injectable()
export class CacheInvalidationService {
  constructor(private readonly redisService: RedisService) {}

  /**
   * Invalidate all complaint-related caches
   */
  async invalidateComplaintCaches(complaintId?: number): Promise<void> {
    const tags = ['your-bucket-name:list'];

    if (complaintId) {
      tags.push(`complaint:${complaintId}`);
    } else {
      tags.push('your-bucket-name:details');
    }

    await this.redisService.invalidateTags(tags);
  }
}
