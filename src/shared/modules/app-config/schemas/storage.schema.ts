import { z } from 'zod';

export const storageSchema = z.object({
  // Local storage configuration
  BASE_PATH: z.string().min(1, 'BASE_PATH is required').default('./uploads'),

  // Supabase configuration (optional - for cloud storage)
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required').optional(),

  SUPABASE_BUCKET: z.string().min(1, 'SUPABASE_BUCKET is required').optional(),

  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL').optional(),

  // Backup configuration
  BACKUP_STORAGE_FOLDER: z.string().min(1).default('backups'),

  // Firebase configuration (optional - for storage and notifications)
  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT is required').optional(),
});

export type StorageConfig = z.infer<typeof storageSchema>;
