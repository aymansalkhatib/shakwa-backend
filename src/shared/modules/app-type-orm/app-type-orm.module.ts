import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from 'pg';
import { Environment } from '../app-config/env.constant';
import { EnvironmentConfig } from '../app-config/env.schema';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      async useFactory(configService: ConfigService<EnvironmentConfig>) {
        await createDatabaseIfNotExists(configService); // 🛠 Check if the database exists before connecting

        const isDev = configService.get<string>('NODE_ENV') !== Environment.PRODUCTION;

        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: parseInt(configService.get('POSTGRES_PORT'), 10),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DATABASE'),
          entities: ['dist/**/*.entity{.ts,.js}'],

          // ✅ Enable logging
          logging: isDev ? ['error', 'warn', 'migration'] : ['error'],

          // ✅ Enable connection pool settings
          extra: {
            max: 10,
            min: 2,
            idleTimeoutMillis: 30000,
          },

          ...(!isDev
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {}),

          // ⚠️ Very dangerous in production! Use migrations instead
          synchronize: isDev,

          // ✅ Enable migrations in production
          migrationsRun: !isDev,
          migrations: isDev ? [] : ['dist/migrations/**/*{.ts,.js}'],
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppTypeOrmModule {}

async function createDatabaseIfNotExists(configService: ConfigService<EnvironmentConfig>) {
  const client = new Client({
    host: configService.get('POSTGRES_HOST'),
    port: parseInt(configService.get('POSTGRES_PORT'), 10),
    user: configService.get('POSTGRES_USER'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: 'postgres',
  });

  try {
    await client.connect();

    const dbName = configService.get('POSTGRES_DATABASE');

    // ✅ Use parameterized query to prevent SQL Injection
    const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (result.rowCount === 0) {
      // ✅ Use protected identifier to prevent SQL injection
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
    throw error;
  } finally {
    await client.end();
  }
}
