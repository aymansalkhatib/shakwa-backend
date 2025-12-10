import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Client } from 'pg';
import { Environment } from '../app-config/env.constant';
import { EnvironmentConfig } from '../app-config/env.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (
        configService: ConfigService<EnvironmentConfig>,
      ): Promise<TypeOrmModuleOptions> => {
        const isProduction = configService.get<string>('NODE_ENV') === Environment.PRODUCTION;
        const isDevelopment = !isProduction;

        // Dev-only: create DB if it does not exist
        if (isDevelopment) {
          await createDatabaseIfNotExists(configService);
        }

        const host = configService.getOrThrow<string>('POSTGRES_HOST');
        const port = configService.getOrThrow<number>('POSTGRES_PORT');
        const username = configService.getOrThrow<string>('POSTGRES_USER');
        const password = configService.getOrThrow<string>('POSTGRES_PASSWORD');
        const database = configService.getOrThrow<string>('POSTGRES_DATABASE');

        return {
          // Basic connection
          type: 'postgres',
          host,
          port,
          username,
          password,
          database,

          // Entity discovery (Nest auto-load + glob for CLI/migrations)
          autoLoadEntities: true,
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],

          // Schema management
          synchronize: isDevelopment,
          migrationsRun: isProduction,
          migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
          migrationsTableName: 'migrations',

          // Logging
          logging: isDevelopment ? ['error', 'warn', 'migration'] : ['error'],

          // SSL: off in dev, on in prod (accept self-signed)
          ssl: isDevelopment
            ? false
            : {
                rejectUnauthorized: false,
              },

          // pg pool options
          extra: {
            max: 10,
            min: 1,
            // Close idle clients after 30s, but keep at least 1 warm connection
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
            keepAlive: true,
            keepAliveInitialDelayMillis: 10000,
          },

          // Retry DB connection on startup (cold-start / restart)
          retryAttempts: 3,
          retryDelay: 5000,
        };
      },
    }),
  ],
})
export class AppTypeOrmModule {}

// Dev-only helper: ensure target database exists
async function createDatabaseIfNotExists(
  configService: ConfigService<EnvironmentConfig>,
): Promise<void> {
  const host = configService.getOrThrow<string>('POSTGRES_HOST');
  const port = configService.getOrThrow<number>('POSTGRES_PORT');
  const user = configService.getOrThrow<string>('POSTGRES_USER');
  const password = configService.getOrThrow<string>('POSTGRES_PASSWORD');
  const dbName = configService.getOrThrow<string>('POSTGRES_DATABASE');

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();

    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`ℹ️ Database "${dbName}" already exists.`);
    }
  } catch (error: any) {
    console.error('❌ Error checking/creating database:', error?.message ?? error);
    throw error;
  } finally {
    await client.end();
  }
}
