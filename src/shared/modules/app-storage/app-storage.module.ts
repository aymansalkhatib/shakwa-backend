import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../app-config/env.schema';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  DEFAULT_FILE_VALIDATION_OPTIONS,
} from './constants/file-validation';
import { STORAGE_CONSTANTS } from './constants/storage';
import { LocalStorageService } from './local-storage.service';
import { ImageProcessingPipe } from './pipes/image-processing.pipe';
import { CustomFileParsingPipe } from './pipes/parse-file.pipe';
import { SupabaseStorageService } from './supabase-storage.service';
import {
  FileValidationOptions,
  ImageCompressionOptions,
  LocalStorageConfig,
  StorageConfig,
  StorageProvider,
  SupabaseStorageConfig,
} from './types';

@Module({})
export class AppStorageModule {
  /**
   * Registers the storage module with the specified provider and configuration
   * @param config - Storage provider configuration
   * @returns Dynamic module configuration
   */
  static register(config: { provider: StorageProvider; options?: StorageConfig }): DynamicModule {
    const storageProvider = this.createStorageProvider(config);
    const commonProviders = this.createCommonProviders();

    return {
      module: AppStorageModule,
      global: true,
      providers: [...commonProviders, storageProvider],
      exports: [...commonProviders, storageProvider],
    };
  }

  /**
   * Creates the storage service provider based on the selected provider type
   */
  private static createStorageProvider(config: {
    provider: StorageProvider;
    options?: StorageConfig;
  }): Provider {
    return {
      provide: STORAGE_CONSTANTS.STORAGE_PROVIDER_SERVICE,
      inject: [ConfigService],
      useFactory: (
        configService: ConfigService<EnvironmentConfig>,
      ): LocalStorageService | SupabaseStorageService => {
        const finalConfig = this.buildFinalConfig(config, configService);

        switch (config.provider) {
          case 'local': {
            const localConfig = finalConfig.localConfig;
            if (!localConfig?.BASE_PATH) {
              throw new Error('Local storage requires BASE_PATH configuration');
            }
            return new LocalStorageService(localConfig);
          }

          case 'supabase': {
            const supabaseConfig = finalConfig.supabaseConfig;
            if (
              !supabaseConfig?.SUPABASE_URL ||
              !supabaseConfig?.SUPABASE_SERVICE_ROLE_KEY ||
              !supabaseConfig?.SUPABASE_BUCKET
            ) {
              throw new Error(
                'Supabase storage requires SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_BUCKET',
              );
            }
            return new SupabaseStorageService(supabaseConfig);
          }

          default:
            throw new Error(`Unsupported storage provider: ${config.provider}`);
        }
      },
    };
  }

  /**
   * Builds the final configuration by merging defaults with user-provided options
   */
  private static buildFinalConfig(
    config: { provider: StorageProvider; options?: StorageConfig },
    configService: ConfigService<EnvironmentConfig>,
  ): StorageConfig {
    const defaultLocal: LocalStorageConfig = {
      BASE_PATH: configService.getOrThrow<string>('BASE_PATH'),
    };

    const defaultSupabase: SupabaseStorageConfig = {
      SUPABASE_URL: configService.get<string>('SUPABASE_URL'),
      SUPABASE_SERVICE_ROLE_KEY: configService.get<string>('SUPABASE_SERVICE_ROLE_KEY'),
      SUPABASE_BUCKET: configService.get<string>('SUPABASE_BUCKET'),
    };

    return {
      localConfig: {
        ...defaultLocal,
        ...config.options?.localConfig,
      },
      supabaseConfig: {
        ...defaultSupabase,
        ...config.options?.supabaseConfig,
      },
    };
  }

  /**
   * Creates common providers used across all storage implementations
   */
  private static createCommonProviders(): Provider[] {
    return [
      {
        provide: STORAGE_CONSTANTS.IMAGE_COMPRESSION_CONFIG,
        useValue: DEFAULT_COMPRESSION_OPTIONS as ImageCompressionOptions,
      },
      {
        provide: STORAGE_CONSTANTS.FILE_VALIDATION_CONFIG,
        useValue: DEFAULT_FILE_VALIDATION_OPTIONS as FileValidationOptions,
      },
      ImageProcessingPipe,
      CustomFileParsingPipe,
    ];
  }
}
