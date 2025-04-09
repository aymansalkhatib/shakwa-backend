/**
 * Supported storage providers
 */
export type StorageProvider = 'local' | 'firebase' | 'supabase';

/**
 * Base configuration options for storage providers.
 */
export interface StorageConfig {
  localConfig?: LocalStorageConfig;
  firebaseConfig?: FirebaseStorageConfig;
  supabaseConfig?: SupabaseStorageConfig;
}

/**
 * Configuration for the local storage provider.
 */
export interface LocalStorageConfig {
  /**
   * The base path where files will be stored.
   */
  basePath: string;
}

/**
 * Configuration for the Firebase storage provider.
 */
export interface FirebaseStorageConfig {
  /**
   * API key for Firebase project.
   */
  apiKey: string;

  /**
   * Firebase project ID.
   */
  projectId: string;

  /**
   * Firebase storage bucket URL.
   */
  storageBucket: string;

  /**
   * Firebase App ID, optional.
   */
  appId?: string;
}

/**
 * Configuration for the Supabase storage provider.
 */
export interface SupabaseStorageConfig {
  /**
   * The Supabase URL endpoint.
   */
  url: string;

  /**
   * The Supabase API key.
   */
  apiKey: string;

  /**
   * The Supabase bucket name where files are stored.
   */
  bucket: string;
}
