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
        const ttl = configService.get<number>('RATE_LIMIT_TTL') || 60;
        const limit = configService.get<number>('RATE_LIMIT_MAX') || 20;

        return {
          throttlers: [
            {
              ttl: ttl * 1000,
              limit: limit,
            },
          ],
        };
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class AppThrottlerModule {}
