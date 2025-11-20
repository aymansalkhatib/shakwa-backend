import { z } from 'zod';

export const databaseSchema = z.object({
  // PostgreSQL Configuration
  POSTGRES_HOST: z.string().min(1, 'POSTGRES_HOST is required'),

  POSTGRES_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('POSTGRES_PORT must be a valid port number')),

  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER is required'),

  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),

  POSTGRES_DATABASE: z.string().min(1, 'POSTGRES_DATABASE is required'),

  REDIS_URL: z.string().min(1, 'REDIS_URL is required').url('REDIS_URL must be a valid URL'),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
