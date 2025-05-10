import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EnvironmentConfig } from '../app-config/env.schema';
import { Environment } from '../app-config/env.constant';
import { User } from 'src/modules/users/entities/base/user.entity';
import { Session } from 'src/modules/auth/session.entity';
import { Client } from 'pg';
console.log(__dirname + '/../**/*.entity{.ts,.js}');

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      async useFactory(configService: ConfigService<EnvironmentConfig>) {
        await createDatabaseIfNotExists(); // 🛠 تأكد القاعدة موجودة قبل الاتصال
        return {
          type: 'postgres',
          host: configService.get('POSTGRES_HOST'),
          port: parseInt(configService.get('POSTGRES_PORT'), 10),
          username: configService.get('POSTGRES_USER'),
          password: configService.get('POSTGRES_PASSWORD'),
          database: configService.get('POSTGRES_DB'),
          entities: ['dist/**/*.entity{.ts,.js}'],
          synchronize: configService.get<string>('NODE_ENV') !== Environment.PRODUCTION,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class AppTypeOrmModule {}

async function createDatabaseIfNotExists() {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: parseInt(process.env.POSTGRES_PORT, 10),
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: 'postgres', // اتصال على database موجودة أكيد (postgres default)
  });

  try {
    await client.connect();

    const dbName = process.env.POSTGRES_DB;

    const result = await client.query(`SELECT 1 FROM pg_database WHERE datname='${dbName}'`);
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`✅ Database "${dbName}" created successfully.`);
    } else {
      console.log(`✅ Database "${dbName}" already exists.`);
    }
  } catch (error) {
    console.error('❌ Error creating database:', error);
  } finally {
    await client.end();
  }
}
