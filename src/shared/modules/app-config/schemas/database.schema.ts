import { z } from 'zod';

export const databaseSchema = z.object({
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT host is required'),

  STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET host is required'),

  // Supabase Configuration
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),

  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),

  SUPABASE_BUCKET: z.string().min(1, 'SUPABASE_BUCKET is required'),

  BASE_PATH: z.string().min(1, 'BASE_PATH is required for local file uploads'),

  // SQLite Configuration
  SQLITE_DATABASE_PATH: z.string().min(1, 'SQLITE_DATABASE_PATH is required'),

  // PostgreSQL Configuration
  POSTGRES_HOST: z.string().min(1, 'POSTGRES_HOST is required'),

  POSTGRES_PORT: z.string().min(1, 'POSTGRES_PORT is required'),

  POSTGRES_USER: z.string().min(1, 'POSTGRES_USER is required'),

  POSTGRES_PASSWORD: z.string().min(1, 'POSTGRES_PASSWORD is required'),

  POSTGRES_DB_Name: z.string().min(1, 'POSTGRES_DB_Name is required'),

  // Max sessions per user
  MAX_SESSIONS_PER_USER: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0, {
      message: 'MAX_SESSIONS_PER_USER must be a valid positive integer',
    }),
});

export type DatabaseConfig = z.infer<typeof databaseSchema>;
