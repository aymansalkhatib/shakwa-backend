import { Global, Module } from '@nestjs/common';
import { RedisModule } from '../redis';
import { CustomRateLimitService } from './custom-rate-limit.service';

@Global()
@Module({
  imports: [RedisModule],
  providers: [CustomRateLimitService],
  exports: [CustomRateLimitService],
})
export class CustomRateLimitModule {}
