import { ConfigService } from '@nestjs/config';
import { QueryRunner } from 'typeorm';
import { InternalRole } from '../../common/enums/role.enum';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';
import { EnvironmentConfig } from '../../shared/modules/app-config';

export async function seedUsers(
  queryRunner: QueryRunner,
  configService: ConfigService<EnvironmentConfig>,
) {
  const internalUserRepo = queryRunner.manager.getRepository(InternalUserEntity);
  const superAdminPassword = configService.getOrThrow<string>('SUPER_ADMIN_PASSWORD');

  // Check if superadmin already exists
  const existingSuperAdmin = await internalUserRepo.findOne({
    where: { role: InternalRole.ADMIN },
  });

  if (existingSuperAdmin) {
    console.log(`❌ Superadmin with email ${existingSuperAdmin.email} already exists`);
    return;
  }

  // Create superadmin user
  const superAdmin = internalUserRepo.create({
    fullName: 'Super Admin',
    email: 'admin@shakwa.com',
    password: superAdminPassword,
    role: InternalRole.ADMIN,
  });

  await internalUserRepo.save(superAdmin);

  console.log('🎉 Users seeding completed successfully!');
}
