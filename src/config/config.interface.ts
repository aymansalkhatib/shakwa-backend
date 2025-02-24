import {
  IsBoolean,
  IsDefined,
  IsNumber,
  IsString,
  validateSync,
  ValidationError,
} from 'class-validator';
import { plainToInstance, Transform } from 'class-transformer';

function BooleanTransformer({ value }: { value: string }): boolean {
  if (value !== 'true' && value !== 'false') {
    throw new Error('Value must be either "true" or "false"');
  }
  return value === 'true';
}

export class AppConfig {
  @IsDefined({ message: 'PORT is required' })
  @IsNumber({}, { message: 'PORT must be a number' })
  PORT: number;

  @IsDefined({ message: 'DATABASE_HOST is required' })
  @IsString({ message: 'DATABASE_HOST must be a string' })
  DATABASE_HOST: string;

  @IsDefined({ message: 'DATABASE_PORT is required' })
  @IsNumber({}, { message: 'DATABASE_PORT must be a number' })
  DATABASE_PORT: number;

  @IsDefined({ message: 'JWT_SECRET is required' })
  @IsString({ message: 'JWT_SECRET must be a string' })
  JWT_SECRET: string;

  @IsDefined({ message: 'LOG_REQUEST is required' })
  @IsBoolean({ message: 'LOG_REQUEST must be a boolean' })
  @Transform(BooleanTransformer)
  LOG_REQUEST: boolean;

  @IsDefined({ message: 'LOG_ERROR is required' })
  @IsBoolean({ message: 'LOG_ERROR must be a boolean' })
  @Transform(BooleanTransformer)
  LOG_ERROR: boolean;
}

export function validateConfig(config: Record<string, unknown>): AppConfig {
  const validatedConfig = plainToInstance(AppConfig, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, { skipMissingProperties: false });

  if (errors.length > 0) {
    const formattedErrors = formatValidationErrors(errors);
    throw new Error(`Config validation failed:\n${formattedErrors}`);
  }

  return validatedConfig;
}

function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map(
      (error) =>
        `${error.property}: ${Object.values(error.constraints || {}).join(', ')}`,
    )
    .join('\n');
}
