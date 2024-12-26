import { IsBoolean, IsNumber, IsString } from 'class-validator';
import { plainToInstance } from 'class-transformer';

export class AppConfig {
  @IsNumber()
  PORT: number;

  @IsString()
  DATABASE_HOST: string;

  @IsNumber()
  DATABASE_PORT: number;

  @IsString()
  JWT_SECRET: string;

  @IsBoolean()
  LOG_REQUEST: boolean;

  @IsBoolean()
  LOG_ERROR: boolean;
}

export function validateConfig(config: Record<string, unknown>): AppConfig {
  return plainToInstance(AppConfig, config, {
    enableImplicitConversion: true,
  });
}
