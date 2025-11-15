/**
 * Supported storage providers
 */
export type StorageProvider = 'local' | 'supabase';

/**
 * Base configuration options for storage providers
 */
export interface StorageConfig {
  localConfig?: LocalStorageConfig;
  supabaseConfig?: SupabaseStorageConfig;
}

/**
 * Configuration for the local storage provider
 */
export interface LocalStorageConfig {
  /**
   * The base directory path where files will be stored
   * @example './uploads' or '/var/www/uploads'
   */
  BASE_PATH: string;
}

/**
 * Configuration for the Supabase storage provider
 */
export interface SupabaseStorageConfig {
  /**
   * The Supabase project URL
   * @example 'https://xxxxx.supabase.co'
   */
  SUPABASE_URL: string;

  /**
   * The Supabase service role key for server-side operations
   */
  SUPABASE_SERVICE_ROLE_KEY: string;

  /**
   * The Supabase storage bucket name
   * @example 'uploads' or 'avatars'
   */
  SUPABASE_BUCKET: string;
}
