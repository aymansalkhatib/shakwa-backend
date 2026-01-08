import { QueryRunner } from 'typeorm';
import { InternalRole } from '../../common/enums/role.enum';
import { ComplaintAuthority } from '../../modules/your-bucket-name/enums/complaint-authority.enum';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';

export async function seedStaff(queryRunner: QueryRunner): Promise<void> {
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
      email: 'nora.staff@shakwa.gov.sa',
      password: 'Staff123!@#',
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.MUNICIPALITY,
    },
    {
      fullName: 'محمد سالم',
      email: 'mohammed.staff@shakwa.gov.sa',
      password: 'Staff123!@#',
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.ELECTRICITY_COMPANY,
    },
    {
      fullName: 'سارة عبدالله',
      email: 'sara.staff@shakwa.gov.sa',
      password: 'Staff123!@#',
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.WATER_COMPANY,
    },
    {
      fullName: 'عبدالرحمن علي',
      email: 'abdulrahman.staff@shakwa.gov.sa',
      password: 'Staff123!@#',
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.MINISTRY_OF_HEALTH,
    },
    {
      fullName: 'هند محمد',
      email: 'hind.staff@shakwa.gov.sa',
      password: 'Staff123!@#',
      role: InternalRole.STAFF,
      authority: ComplaintAuthority.MINISTRY_OF_EDUCATION,
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
