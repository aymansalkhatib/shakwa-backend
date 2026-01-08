import { QueryRunner } from 'typeorm';
import { CitizenEntity } from '../../modules/citizens/entities/citizen.entity';

export async function seedCitizens(queryRunner: QueryRunner): Promise<void> {
  console.log('Starting citizens seeding...');

  const citizenRepo = queryRunner.manager.getRepository(CitizenEntity);

  const existingCitizens = await citizenRepo.count();

  if (existingCitizens > 0) {
    console.log(`${existingCitizens} citizens already exist in the system`);
    return;
  }

  const citizensData = [
    {
      fullName: 'محمد عبدالله السعودي',
      email: 'mohammed.saudi@gmail.com',
      phone: '+966501234567',
      password: 'Citizen123!',
    },
    {
      fullName: 'نورا أحمد الخالدي',
      email: 'nora.khalidi@gmail.com',
      phone: '+966502345678',
      password: 'Citizen123!',
    },
    {
      fullName: 'خالد سعد المطيري',
      email: 'khalid.mutairi@gmail.com',
      phone: '+966503456789',
      password: 'Citizen123!',
    },
    {
      fullName: 'فاطمة علي القحطاني',
      email: 'fatima.qahtani@gmail.com',
      phone: '+966504567890',
      password: 'Citizen123!',
    },
    {
      fullName: 'عبدالرحمن محمد الشهري',
      email: 'abdulrahman.shahri@gmail.com',
      phone: '+966505678901',
      password: 'Citizen123!',
    },
    {
      fullName: 'سارة سالم العتيبي',
      email: 'sara.otaibi@gmail.com',
      phone: '+966506789012',
      password: 'Citizen123!',
    },
    {
      fullName: 'أحمد يوسف الغامدي',
      email: 'ahmed.ghamdi@gmail.com',
      phone: '+966507890123',
      password: 'Citizen123!',
    },
    {
      fullName: 'هند عبدالعزيز الدوسري',
      email: 'hind.dosari@gmail.com',
      phone: '+966508901234',
      password: 'Citizen123!',
    },
  ];

  const createdCitizens: CitizenEntity[] = [];
  for (const citizenData of citizensData) {
    const citizen = citizenRepo.create(citizenData);
    const savedCitizen = await citizenRepo.save(citizen);
    createdCitizens.push(savedCitizen);
  }

  console.log('Citizens seeding completed successfully');
}
