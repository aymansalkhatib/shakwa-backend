import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { Client } from 'pg';
import { Environment } from '../app-config/env.constant';
import { EnvironmentConfig } from '../app-config/env.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      async useFactory(
        configService: ConfigService<EnvironmentConfig>,
      ): Promise<TypeOrmModuleOptions> {
        await createDatabaseIfNotExists(configService);

        const isDev = configService.get<string>('NODE_ENV') !== Environment.PRODUCTION;

        return {
          type: 'postgres',
          host: configService.getOrThrow<string>('POSTGRES_HOST'),
          port: configService.getOrThrow<number>('POSTGRES_PORT'),
          username: configService.getOrThrow<string>('POSTGRES_USER'),
          password: configService.getOrThrow<string>('POSTGRES_PASSWORD'),
          database: configService.getOrThrow<string>('POSTGRES_DATABASE'),
          entities: [__dirname + '/../../**/*.entity{.ts,.js}'],
          autoLoadEntities: true,

          logging: isDev ? ['error', 'warn', 'migration'] : ['error'],

          extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000,
          },

          ssl: isDev
            ? false
            : {
                rejectUnauthorized: false,
              },

          synchronize: isDev,
          migrationsRun: !isDev,
          migrations: [__dirname + '/../../migrations/**/*{.ts,.js}'],
          migrationsTableName: 'migrations',
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppTypeOrmModule {}

async function createDatabaseIfNotExists(configService: ConfigService<EnvironmentConfig>) {
  const client = new Client({
    host: configService.getOrThrow('POSTGRES_HOST'),
    port: configService.getOrThrow<number>('POSTGRES_PORT'),
    user: configService.getOrThrow('POSTGRES_USER'),
    password: configService.getOrThrow('POSTGRES_PASSWORD'),
    database: 'postgres',
  });

  try {
    await client.connect();

    const dbName = configService.getOrThrow('POSTGRES_DATABASE');

    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`ℹ️  Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error checking/creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}
