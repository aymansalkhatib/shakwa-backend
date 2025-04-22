import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  DEFAULT_FILE_VALIDATION_OPTIONS,
} from './constants/file-validation.constants.ts.js';
import { STORAGE_CONSTANTS } from './constants/storage.constants.js';
import { LocalStorageService } from './local-storage.service.js';
import { ImageProcessingPipe } from './pipes/image-processing.pipe.js';
import { CustomFileParsingPipe } from './pipes/parse-file.pipe.js';
import {
  FileValidationOptions,
  ImageCompressionOptions,
  StorageConfig,
  StorageProvider,
} from './types/index.js';
import { SupabaseStorageService } from './supabase-storage.service.js';

@Module({})
export class StorageModule {
  /**
   * Registers the storage module with the specified provider and configuration
   */
  static register(config: {
    provider: StorageProvider;
    options: StorageConfig;
  }): DynamicModule {
    const storageProvider = this.createStorageProvider(config);
    const commonProviders = this.createCommonProviders();

    return {
      module: StorageModule,
      providers: [...commonProviders, storageProvider],
      exports: [...commonProviders.map((provider) => provider), storageProvider],
      global: true, // Makes the module available globally
    };
  }

  /**
   * Creates the storage service provider based on the selected provider type
   */
  private static createStorageProvider(config: {
    provider: StorageProvider;
    options: StorageConfig;
  }): Provider {
    return {
      provide: STORAGE_CONSTANTS.STORAGE_PROVIDER_SERVICE,
      useFactory: () => {
        switch (config.provider) {
          case 'local':
            if (!config.options.localConfig) {
              throw new Error(
                'Local configuration is required for local storage provider',
              );
            }
            return new LocalStorageService(config.options.localConfig);

          case 'supabase':
            if (!config.options.supabaseConfig) {
              throw new Error(
                'Supabase configuration is required for Supabase storage provider',
              );
            }
            return new SupabaseStorageService(config.options.supabaseConfig);
          default:
            throw new Error(`Unsupported storage provider: ${config.provider}`);
        }
      },
    };
  }

  /**
   * Creates common providers used across all storage implementations
   */
  private static createCommonProviders(): Provider[] {
    return [
      // Image compression configuration
      {
        provide: STORAGE_CONSTANTS.IMAGE_COMPRESSION_CONFIG,
        useValue: {
          ...DEFAULT_COMPRESSION_OPTIONS,
        } as ImageCompressionOptions,
      },
      // File validation configuration
      {
        provide: STORAGE_CONSTANTS.FILE_VALIDATION_CONFIG,
        useValue: {
          ...DEFAULT_FILE_VALIDATION_OPTIONS,
        } as FileValidationOptions,
      },
      // Pipes
      ImageProcessingPipe,
      CustomFileParsingPipe,
    ];
  }
}
