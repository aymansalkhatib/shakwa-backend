// src/config/app-config.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './config.interface';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateConfig,
      envFilePath: [
        'src/config/env/.env',
        `src/config/env/.env.${process.env.NODE_ENV || 'development'}`,
      ],
    }),
  ],
})
export class AppConfigModule {}
