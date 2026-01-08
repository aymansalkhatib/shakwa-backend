import { QueryRunner } from 'typeorm';
import { InternalRole } from '../../common/enums/role.enum';
import { ComplaintAuthority } from '../../modules/your-bucket-name/enums/complaint-authority.enum';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';

export async function seedAdmins(queryRunner: QueryRunner): Promise<void> {
  console.log('Starting admins seeding...');

  const internalUserRepo = queryRunner.manager.getRepository(InternalUserEntity);

  const existingAdmins = await internalUserRepo.count({
    where: { role: InternalRole.ADMIN },
  });

  if (existingAdmins > 0) {
    console.log(`${existingAdmins} admins already exist in the system`);
    return;
  }

  const adminsData = [
    {
      fullName: 'أحمد محمد',
      email: 'admin@shakwa.gov.sa',
      password: 'Admin123!@#',
      role: InternalRole.ADMIN,
      authority: ComplaintAuthority.MUNICIPALITY,
    },
    {
      fullName: 'فاطمة علي',
      email: 'fatima.admin@shakwa.gov.sa',
      password: 'Admin123!@#',
      role: InternalRole.ADMIN,
      authority: ComplaintAuthority.ELECTRICITY_COMPANY,
    },
    {
      fullName: 'خالد سعد',
      email: 'khalid.admin@shakwa.gov.sa',
      password: 'Admin123!@#',
      role: InternalRole.ADMIN,
      authority: ComplaintAuthority.WATER_COMPANY,
    },
  ];

  const createdAdmins: InternalUserEntity[] = [];
  for (const adminData of adminsData) {
    const admin = internalUserRepo.create(adminData);
    const savedAdmin = await internalUserRepo.save(admin);
    createdAdmins.push(savedAdmin);
  }

  console.log('Admins seeding completed successfully');
}
