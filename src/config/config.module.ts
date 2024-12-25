import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { configValidationSchema } from './config.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      envFilePath: [
        'src/config/env/.env',
        `src/config/env/.env.${process.env.NODE_ENV || 'development'}`,
      ],
    }),
  ],
})
export class AppConfigModule {}
