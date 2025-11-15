import { z } from 'zod';

export const storageSchema = z.object({
  // Base path for file storage
  BASE_PATH: z.string().min(1, 'BASE_PATH is required').default('./uploads'),

  // Supabase configuration for cloud storage
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY is required for Supabase storage'),

  SUPABASE_BUCKET: z.string().min(1, 'SUPABASE_BUCKET is required for Supabase storage'),

  SUPABASE_URL: z
    .string()
    .min(1, 'SUPABASE_URL is required for Supabase storage')
    .url('SUPABASE_URL must be a valid URL'),
});

export type StorageConfig = z.infer<typeof storageSchema>;
