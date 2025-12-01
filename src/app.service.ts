import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from './shared/modules/app-config';
import { RedisService } from './shared/services/redis';

@Injectable()
export class AppService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  async getHello() {
    return 'Hello';
  }

  async cleanRedis() {
    // if (this.configService.getOrThrow('NODE_ENV') !== 'development') {
    //   throw new ForbiddenException('cleanRedis can only be run in development environment');
    // }

    await this.redisService.flushAll();
    return {
      message: 'Redis cache flushed successfully',
    };
  }
}
