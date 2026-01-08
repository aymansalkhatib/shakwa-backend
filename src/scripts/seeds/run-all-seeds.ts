import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import { AppModule } from '../../app.module';
import { EnvironmentConfig } from '../../shared/modules/app-config/env.schema';
import { seedAdmins } from './seed-admins';
import { seedCitizens } from './seed-citizens';
import { seedComplaints } from './seed-your-bucket-name';
import { seedStaff } from './seed-staff';
import { seedUsers } from './seed-users';

async function bootstrap() {
  const args = process.argv.slice(2);
  const runUsers = args.includes('users');
  const runAdmins = args.includes('admins');
  const runStaff = args.includes('staff');
  const runCitizens = args.includes('citizens');
  const runComplaints = args.includes('your-bucket-name');
  const runAll = args.includes('all');

  const shouldRunAll = args.length === 0 || runAll;

  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  const configService = app.get(ConfigService<EnvironmentConfig>);
  const queryRunner = dataSource.createQueryRunner();

  try {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    console.log('Starting database seeding process...');

    if (runUsers || shouldRunAll) {
      await seedUsers(queryRunner, configService);
      console.log('Users seeding completed');
    }

    if (runAdmins || shouldRunAll) {
      await seedAdmins(queryRunner);
      console.log('Admins seeding completed');
    }

    if (runStaff || shouldRunAll) {
      await seedStaff(queryRunner);
      console.log('Staff seeding completed');
    }

    if (runCitizens || shouldRunAll) {
      await seedCitizens(queryRunner);
      console.log('Citizens seeding completed');
    }

    if (runComplaints || shouldRunAll) {
      await seedComplaints(queryRunner);
      console.log('Complaints seeding completed');
    }

    await queryRunner.commitTransaction();

    console.log('Database seeding process completed successfully');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Database seeding process failed:', error);
    throw error;
  } finally {
    await queryRunner.release();
    await app.close();
  }
}

bootstrap()
  .then(() => {
    console.log('Seeder finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeder failed:', error.message);
    process.exit(1);
  });
