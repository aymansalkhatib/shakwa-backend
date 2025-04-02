import { z } from 'zod';
import {
  BooleanFalsyValues,
  BooleanTruthyValues,
  ENV_VALIDATION,
} from './env.constant';

/**
 * Boolean string transformer
 */
const booleanTransformer = (val: string): boolean => {
  const normalized = val.toLowerCase().trim() as
    | BooleanTruthyValues
    | BooleanFalsyValues;
  if (ENV_VALIDATION.BOOLEAN_TRUTHY.includes(normalized as BooleanTruthyValues))
    return true;
  if (ENV_VALIDATION.BOOLEAN_FALSY.includes(normalized as BooleanFalsyValues))
    return false;
  throw new Error(
    `Invalid boolean value: "${val}". Expected one of: ${[...ENV_VALIDATION.BOOLEAN_TRUTHY, ...ENV_VALIDATION.BOOLEAN_FALSY].join(', ')}`,
  );
};

/**
 * Environment validation schema
 */
export const environmentSchema = z.object({
  // Server Configuration
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int()),

  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database Configuration
  DATABASE_HOST: z.string().min(1, 'Database host is required'),
  DATABASE_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int()),

  // Security Configuration
  JWT_SECRET: z
    .string()
    .min(
      ENV_VALIDATION.MIN_JWT_LENGTH,
      `JWT secret should be at least ${ENV_VALIDATION.MIN_JWT_LENGTH} characters long`,
    ),

  // Logging Configuration
  LOG_REQUEST: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(false),

  LOG_ERROR: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(true),
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
