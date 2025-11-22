import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../shared/services/redis/redis.service';

@Injectable()
export class CacheInvalidationService {
  private readonly logger = new Logger(CacheInvalidationService.name);

  constructor(private readonly redisService: RedisService) {}

  /**
   * Invalidate all complaint-related caches
   */
  async invalidateComplaintCaches(complaintId?: number): Promise<void> {
    try {
      // If specific complaint ID, invalidate its cache
      if (complaintId) {
        const patterns = [
          `cache:*/your-bucket-name/${complaintId}*`,
          `cache:*/your-bucket-name*`, // Also invalidate list caches
        ];

        for (const pattern of patterns) {
          await this.deleteByPattern(pattern);
        }
      } else {
        // Invalidate all complaint caches
        await this.deleteByPattern('cache:*/your-bucket-name*');
      }

      this.logger.debug(
        `Invalidated complaint caches${complaintId ? ` for ID: ${complaintId}` : ''}`,
      );
    } catch (error) {
      this.logger.error('Failed to invalidate complaint caches:', error);
    }
  }

  /**
   * Delete keys matching a pattern (simplified version)
   * Note: In production, use SCAN instead of KEYS for better performance
   */
  private async deleteByPattern(pattern: string): Promise<void> {
    try {
      // For now, we'll delete specific known patterns
      // In production, implement SCAN-based deletion
      const commonKeys = [
        'cache:/citizen/your-bucket-name',
        'cache:/staff/your-bucket-name',
        'cache:/admin/your-bucket-name',
      ];

      for (const key of commonKeys) {
        await this.redisService.delete(key);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete pattern ${pattern}:`, error);
    }
  }
}
