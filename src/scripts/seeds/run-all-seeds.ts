import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { EnvironmentConfig } from '../../shared/modules/app-config/env.schema';
import { seedUsers } from './seed-users';

async function bootstrap() {
  const args = process.argv.slice(2);
  const runEmployees = args.includes('users');
  const runAll = args.includes('all');

  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService<EnvironmentConfig>);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (runEmployees) {
      await seedUsers(queryRunner, configService);
      console.log('✅ Employees seeded');
    }
    if (runAll) {
      await seedUsers(queryRunner, configService);
      console.log('✅ All seeders ran');
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding:', error);
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => {
    console.log('✨ Seeder finished');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeder failed:', error.message);
    process.exit(1);
  });
