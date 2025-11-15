import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from '../app-config/app-config.module';
import { EnvironmentConfig } from '../app-config/env.schema';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [AppConfigModule],
      inject: [ConfigService<EnvironmentConfig>],
      useFactory: (configService: ConfigService<EnvironmentConfig>) => {
        const ttlSeconds = configService.getOrThrow<number>('RATE_LIMIT_TTL');
        const limit = configService.getOrThrow<number>('RATE_LIMIT_MAX');

        return {
          throttlers: [
            {
              name: 'default',
              ttl: ttlSeconds * 1000, // Convert seconds to milliseconds
              limit,
            },
          ],
        };
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
