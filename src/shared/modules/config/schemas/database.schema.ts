import { z } from 'zod';

export const databaseSchema = z.object({
  DATABASE_HOST: z.string().min(1, 'Database host is required'),

  DATABASE_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int()),

  FIREBASE_SERVICE_ACCOUNT: z
    .string()
    .min(1, 'FIREBASE_SERVICE_ACCOUNT host is required'),

  STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET host is required'),

  // Supabase Configuration
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),

  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  SUPABASE_BUCKET: z.string().min(1, 'SUPABASE_BUCKET is required'),

  BASE_PATH: z.string().min(1, 'BASE_PATH is required for local file uploads'),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
