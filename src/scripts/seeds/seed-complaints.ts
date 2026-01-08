import { QueryRunner } from 'typeorm';
import { InternalRole } from '../../common/enums/role.enum';
import { CitizenEntity } from '../../modules/citizens/entities/citizen.entity';
import { ComplaintHistoryEntity } from '../../modules/your-bucket-name/entities/complaint-history.entity';
import { ComplaintEntity } from '../../modules/your-bucket-name/entities/complaint.entity';
import { ComplaintAuthority } from '../../modules/your-bucket-name/enums/complaint-authority.enum';
import { ComplaintCategory } from '../../modules/your-bucket-name/enums/complaint-category.enum';
import { ComplaintStatus } from '../../modules/your-bucket-name/enums/complaint-status.enum';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';

export async function seedComplaints(queryRunner: QueryRunner): Promise<void> {
  console.log('Starting your-bucket-name seeding...');

  const internalUserRepo = queryRunner.manager.getRepository(InternalUserEntity);
  const citizenRepo = queryRunner.manager.getRepository(CitizenEntity);
  const complaintRepo = queryRunner.manager.getRepository(ComplaintEntity);
  const historyRepo = queryRunner.manager.getRepository(ComplaintHistoryEntity);

  const existingComplaints = await complaintRepo.count();
  if (existingComplaints > 0) {
    console.log(`${existingComplaints} your-bucket-name already exist in the system`);
    return;
  }

  const admins = await internalUserRepo.find({
    where: { role: InternalRole.ADMIN },
    order: { id: 'ASC' },
  });

  const staff = await internalUserRepo.find({
    where: { role: InternalRole.STAFF },
    order: { id: 'ASC' },
  });

  if (admins.length === 0) {
    console.log('No admins found in the system. Please run seed-admins first');
    return;
  }

  if (staff.length === 0) {
    console.log('No staff found in the system. Please run seed-staff first');
    return;
  }

  const citizens = await citizenRepo.find({
    order: { id: 'ASC' },
  });

  if (citizens.length === 0) {
    console.log('No citizens found in the system. Please run seed-citizens first');
    return;
  }

  const complaintTemplates = [
    {
      category: ComplaintCategory.INFRASTRUCTURE,
      authority: ComplaintAuthority.MUNICIPALITY,
      title: 'مشكلة في الإضاءة العامة',
      description: 'يوجد عطل في أعمدة الإنارة في الحي مما يسبب صعوبة في الحركة ليلاً وعدم الأمان',
      location: 'الرياض، حي النموذجي، شارع الملك فهد',
    },
    {
      category: ComplaintCategory.GENERAL_SERVICE,
      authority: ComplaintAuthority.ELECTRICITY_COMPANY,
      title: 'انقطاع متكرر في التيار الكهربائي',
      description: 'انقطاع متكرر في التيار الكهربائي يؤثر على الأجهزة المنزلية ويسبب أضراراً مالية',
      location: 'الرياض، حي الملز، مجمع سكني رقم 15',
    },
    {
      category: ComplaintCategory.INFRASTRUCTURE,
      authority: ComplaintAuthority.WATER_COMPANY,
      title: 'تسريب في شبكة المياه',
      description: 'تسريب مياه في الشارع الرئيسي يسبب هدر في المياه وتلف الطريق وصعوبة في المرور',
      location: 'الرياض، حي العليا، تقاطع شارع التحلية مع الأمير محمد بن عبدالعزيز',
    },
    {
      category: ComplaintCategory.HEALTHCARE,
      authority: ComplaintAuthority.MINISTRY_OF_HEALTH,
      title: 'نقص في الخدمات الصحية',
      description: 'نقص في الأطباء المتخصصين في المركز الصحي المحلي وطول فترات الانتظار',
      location: 'الرياض، حي الشفا، المركز الصحي الأولي',
    },
    {
      category: ComplaintCategory.EDUCATION,
      authority: ComplaintAuthority.MINISTRY_OF_EDUCATION,
      title: 'مشكلة في المرافق التعليمية',
      description: 'حاجة إلى صيانة المرافق التعليمية وتحديث المعدات والأجهزة في المدرسة',
      location: 'الرياض، حي الروضة، مدرسة الأمل الابتدائية',
    },
    {
      category: ComplaintCategory.ENVIRONMENT,
      authority: ComplaintAuthority.MUNICIPALITY,
      title: 'تلوث بيئي في المنطقة',
      description: 'وجود مخلفات صناعية وروائح كريهة تؤثر على صحة السكان في المنطقة',
      location: 'الرياض، حي الصناعية، بالقرب من المصانع',
    },
    {
      category: ComplaintCategory.SECURITY,
      authority: ComplaintAuthority.TRAFFIC_POLICE,
      title: 'مشكلة مرورية خطيرة',
      description: 'عدم وجود إشارات مرورية في تقاطع مزدحم يسبب حوادث متكررة',
      location: 'الرياض، حي الملقا، تقاطع شارع الملك خالد مع طريق الملك عبدالعزيز',
    },
    {
      category: ComplaintCategory.BILLING_AND_FEES,
      authority: ComplaintAuthority.ELECTRICITY_COMPANY,
      title: 'خطأ في فاتورة الكهرباء',
      description: 'وجود مبالغ غير صحيحة في فاتورة الكهرباء تفوق الاستهلاك الفعلي بشكل كبير',
      location: 'الرياض، حي النرجس، فيلا رقم 245',
    },
  ];

  let totalComplaints = 0;
  let totalHistories = 0;

  for (let citizenIndex = 0; citizenIndex < citizens.length; citizenIndex++) {
    const citizen = citizens[citizenIndex];
    const your-bucket-nameCount = 10 + (citizenIndex % 15);

    for (let i = 0; i < your-bucket-nameCount; i++) {
      const template = complaintTemplates[i % complaintTemplates.length];

      const complaint = complaintRepo.create({
        citizenId: citizen.id,
        category: template.category,
        authority: template.authority,
      });
      const savedComplaint = await complaintRepo.save(complaint);
      totalComplaints++;

      const histories = await createComplaintHistories(
        historyRepo,
        savedComplaint.id,
        template,
        admins,
        staff,
        i,
      );
      totalHistories += histories.length;
    }
  }

  console.log('Complaints seeding completed successfully');
}

async function createComplaintHistories(
  historyRepo: any,
  complaintId: number,
  template: any,
  admins: InternalUserEntity[],
  staff: InternalUserEntity[],
  complaintIndex: number,
): Promise<ComplaintHistoryEntity[]> {
  const histories: ComplaintHistoryEntity[] = [];

  const initialHistory = historyRepo.create({
    complaintId,
    title: template.title,
    description: template.description,
    status: ComplaintStatus.NEW,
    location: template.location,
    attachments: [`complaint_${complaintId}_photo_1.jpg`, `complaint_${complaintId}_document.pdf`],
    citizenNote: 'أرجو النظر في هذه المشكلة بأسرع وقت ممكن حيث أنها تؤثر على الحياة اليومية',
  });
  histories.push(await historyRepo.save(initialHistory));
  await delay(50);

  const admin = admins[complaintIndex % admins.length];
  const adminReview = historyRepo.create({
    complaintId,
    internalUserId: admin.id,
    title: 'مراجعة أولية من الإدارة',
    description: 'تم استلام الشكوى وهي قيد المراجعة من قبل الفريق المختص للتأكد من صحة البيانات',
    status: ComplaintStatus.IN_REVIEW,
    internalUserNote: `تم تحويل الشكوى للقسم المختص (${template.authority}) للمراجعة والتقييم الفني`,
  });
  histories.push(await historyRepo.save(adminReview));
  await delay(50);

  const staffMember = staff[complaintIndex % staff.length];
  const staffProcessing = historyRepo.create({
    complaintId,
    internalUserId: staffMember.id,
    title: 'بدء معالجة الشكوى',
    description: 'تم البدء في معالجة الشكوى وتحديد الإجراءات المطلوبة والفريق المسؤول',
    status: ComplaintStatus.IN_PROGRESS,
    internalUserNote: 'تم تشكيل فريق عمل متخصص لمعالجة هذه الشكوى وتحديد الموارد المطلوبة',
  });
  histories.push(await historyRepo.save(staffProcessing));
  await delay(50);

  if (complaintIndex % 2 === 0) {
    const followUp = historyRepo.create({
      complaintId,
      internalUserId: admin.id,
      title: 'متابعة تقدم العمل',
      description: 'متابعة تقدم العمل في معالجة الشكوى والتأكد من سير العملية وفقاً للخطة المحددة',
      status: ComplaintStatus.IN_PROGRESS,
      internalUserNote: 'تم التواصل مع الجهة المختصة وهناك تقدم ملحوظ في معالجة المشكلة',
    });
    histories.push(await historyRepo.save(followUp));
    await delay(50);
  }

  const finalStatus = getFinalStatus(complaintIndex);
  const finalHistory = historyRepo.create({
    complaintId,
    internalUserId: complaintIndex % 2 === 0 ? admin.id : staffMember.id,
    title: getFinalTitle(finalStatus),
    description: getFinalDescription(finalStatus),
    status: finalStatus,
    internalUserNote: getFinalNote(finalStatus),
  });
  histories.push(await historyRepo.save(finalHistory));

  return histories;
}

function getFinalStatus(complaintIndex: number): ComplaintStatus {
  const statusOptions = [
    ComplaintStatus.RESOLVED,
    ComplaintStatus.RESOLVED,
    ComplaintStatus.RESOLVED,
    ComplaintStatus.NEED_MORE_INFO,
    ComplaintStatus.IN_PROGRESS,
    ComplaintStatus.REJECTED,
  ];
  return statusOptions[complaintIndex % statusOptions.length];
}

function getFinalTitle(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.RESOLVED:
      return 'تم حل المشكلة بنجاح';
    case ComplaintStatus.NEED_MORE_INFO:
      return 'طلب معلومات إضافية';
    case ComplaintStatus.REJECTED:
      return 'رفض الشكوى';
    default:
      return 'تحديث حالة الشكوى';
  }
}

function getFinalDescription(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.RESOLVED:
      return 'تم حل المشكلة المطروحة في الشكوى بنجاح وإنجاز جميع الأعمال المطلوبة';
    case ComplaintStatus.NEED_MORE_INFO:
      return 'نحتاج إلى معلومات إضافية أو مستندات تكميلية لمعالجة الشكوى بشكل أفضل';
    case ComplaintStatus.REJECTED:
      return 'تم رفض الشكوى لعدم استيفائها للشروط المطلوبة أو خروجها عن نطاق الاختصاص';
    default:
      return 'الشكوى قيد المعالجة والمتابعة';
  }
}

function getFinalNote(status: ComplaintStatus): string {
  switch (status) {
    case ComplaintStatus.RESOLVED:
      return 'تم إنجاز العمل المطلوب وحل المشكلة نهائياً. يرجى التواصل معنا في حال وجود أي استفسارات إضافية';
    case ComplaintStatus.NEED_MORE_INFO:
      return 'يرجى تزويدنا بصور إضافية أو مستندات تدعم الشكوى أو تفاصيل أكثر دقة عن المشكلة';
    case ComplaintStatus.REJECTED:
      return 'الشكوى خارج نطاق اختصاصنا أو لا تستوفي الشروط المطلوبة. يمكن التواصل للاستفسار عن الأسباب';
    default:
      return 'الشكوى قيد المعالجة وسيتم التواصل معكم عند وجود تحديثات';
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
