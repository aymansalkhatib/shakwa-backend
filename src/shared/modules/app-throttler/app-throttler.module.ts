import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { EnvironmentConfig } from '../app-config/env.schema';

/**
 * Throttler (Rate Limiting) Module
 * Provides configurable rate limiting for the application
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<EnvironmentConfig>) => {
        const ttl = configService.get<number>('RATE_LIMIT_TTL') || 60;
        const limit = configService.get<number>('RATE_LIMIT_MAX') || 100;

        return [
          {
            ttl: ttl * 1000,
            limit: limit,
          },
        ];
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
