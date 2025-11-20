import { EnvironmentConfig } from '@app/shared/modules/app-config';
import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import RedisLib from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: (config: ConfigService<EnvironmentConfig>) => {
    const client = new RedisLib(config.getOrThrow('REDIS_URL'));

    client.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    return client;
  },
};
