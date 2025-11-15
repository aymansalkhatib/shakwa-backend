import { QueryRunner } from 'typeorm';

export async function seedEmployees(queryRunner: QueryRunner) {
  // const personRepo = queryRunner.manager.getRepository(Person);
  // const employeeRepo = queryRunner.manager.getRepository(Employee);

  // for (const employeeData of employeesData) {
  //   // التحقق من وجود الشخص بالرقم الوطني
  //   const existingPerson = await personRepo.findOne({
  //     where: { nationalId: employeeData.person.nationalId },
  //   });

  //   if (existingPerson) {
  //     console.log(`❌ Person with national ID ${employeeData.person.nationalId} already exists`);
  //     continue;
  //   }

  //   // إنشاء الشخص
  //   const savedPerson = await personRepo.save(personRepo.create(employeeData.person));

  //   // إنشاء الموظف
  //   await employeeRepo.save(
  //     employeeRepo.create({
  //       id: employeeData.id,
  //       ...employeeData.employee,
  //       personId: savedPerson.id,
  //     }),
  //   );

  //   console.log(`✅ Employee ${employeeData.person.fullName} created successfully`);
  // }

  console.log('🎉 Employees seeding completed successfully!');
}
