import { Provider } from '@nestjs/common';
import RedisLib from 'ioredis';

export const REDIS_CLIENT = 'REDIS_CLIENT';

export const RedisProvider: Provider = {
  provide: REDIS_CLIENT,
  useFactory: () => {
    const client = new RedisLib({
      host: 'localhost',
      port: 6379,
    });

    client.on('error', (err) => {
      console.error('Redis Error:', err);
    });

    return client;
  },
};
