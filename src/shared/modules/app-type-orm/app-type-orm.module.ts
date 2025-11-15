import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentConfig } from '../app-config/env.schema';
import { Environment } from '../app-config/env.constant';
import { Client } from 'pg';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      async useFactory(configService: ConfigService<EnvironmentConfig>) {
        await createDatabaseIfNotExists(configService); // 🛠 تأكد القاعدة موجودة قبل الاتصال

        const isDev = configService.get<string>('NODE_ENV') !== Environment.PRODUCTION;

        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: parseInt(configService.get('POSTGRES_PORT'), 10),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DATABASE'),
          entities: ['dist/**/*.entity{.ts,.js}'],

          ...(!isDev
            ? {
                ssl: {
                  rejectUnauthorized: false,
                },
              }
            : {}),

          synchronize: true,
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

    const result = await client.query(`SELECT 1
                                       FROM pg_database
                                       WHERE datname = '${dbName}'`);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      // console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await client.end();
  }
}
