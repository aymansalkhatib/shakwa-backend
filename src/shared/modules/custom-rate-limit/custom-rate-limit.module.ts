import { Module } from '@nestjs/common';
import { CustomRateLimitService } from './custom-rate-limit.service';
import { RedisModule } from '../../services/redis';

@Module({
  imports: [RedisModule],
  providers: [CustomRateLimitService],
  exports: [CustomRateLimitService],
})
export class CustomRateLimitModule {}
