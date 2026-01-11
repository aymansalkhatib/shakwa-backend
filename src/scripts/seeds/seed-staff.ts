import { EnvironmentConfig } from '@app/shared/modules/app-config';
import { ConfigService } from '@nestjs/config';
import { QueryRunner } from 'typeorm';
import { InternalRole } from '../../common/enums/role.enum';
import { ComplaintAuthority } from '../../modules/your-bucket-name/enums/complaint-authority.enum';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';

export async function seedStaff(
  queryRunner: QueryRunner,
  configService: ConfigService<EnvironmentConfig>,
): Promise<void> {
  console.log('Starting staff seeding...');

  const internalUserRepo = queryRunner.manager.getRepository(InternalUserEntity);

  const existingStaff = await internalUserRepo.count({
    where: { role: InternalRole.STAFF },
  });

  if (existingStaff > 0) {
    console.log(`${existingStaff} staff members already exist in the system`);
    return;
  }

  const staffData = [
    {
      fullName: 'نورا أحمد',
      email: 'nora.staff@shakwa.com',
      password: configService.getOrThrow('SUPER_ADMIN_PASSWORD'),
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.MUNICIPALITY,
    },
  ];

  const createdStaff: InternalUserEntity[] = [];
  for (const staffMember of staffData) {
    const staff = internalUserRepo.create(staffMember);
    const savedStaff = await internalUserRepo.save(staff);
    createdStaff.push(savedStaff);
  }

  console.log('Staff seeding completed successfully');
}
