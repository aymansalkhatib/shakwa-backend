/**
 * Supported storage providers
 */
export type StorageProvider = 'local' | 'supabase';

/**
 * Base configuration options for storage providers.
 */
export interface StorageConfig {
  localConfig?: LocalStorageConfig;
  supabaseConfig?: SupabaseStorageConfig;
}

/**
 * Configuration for the local storage provider.
 */
export interface LocalStorageConfig {
  /**
   * The base path where files will be stored.
   */
  BASE_PATH: string;
}

/**
 * Configuration for the Supabase storage provider.
 */
export interface SupabaseStorageConfig {
  /**
   * The Supabase URL endpoint.
   */
  SUPABASE_URL: string;

  /**
   * The Supabase API key.
   */
  SUPABASE_SERVICE_ROLE_KEY: string;

  /**
   * The Supabase bucket name where files are stored.
   */
  SUPABASE_BUCKET: string;

  /**
   * The base path where files will be stored.
   */
  BASE_PATH: string;
}
