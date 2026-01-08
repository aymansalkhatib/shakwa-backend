import { NotificationService } from '../../../shared/services/notifications/notification.service';
import { CitizensAdminService } from '../../citizens/services/citizens-admin.service';
import { ComplaintStatus } from '../enums';

export type NotificationLang = 'ar' | 'en';

const STATUS_TRANSLATIONS: Record<ComplaintStatus, { ar: string; en: string }> = {
  [ComplaintStatus.NEW]: { ar: 'جديدة', en: 'New' },
  [ComplaintStatus.IN_REVIEW]: { ar: 'قيد المراجعة', en: 'Under Review' },
  [ComplaintStatus.IN_PROGRESS]: { ar: 'قيد المعالجة', en: 'In Progress' },
  [ComplaintStatus.NEED_MORE_INFO]: { ar: 'بحاجة لمعلومات إضافية', en: 'More Info Required' },
  [ComplaintStatus.RESOLVED]: { ar: 'تم الحل', en: 'Resolved' },
  [ComplaintStatus.REJECTED]: { ar: 'مرفوضة', en: 'Rejected' },
  [ComplaintStatus.CANCELLED]: { ar: 'ملغاة', en: 'Cancelled' },
};

const STATUS_DETAILS: Record<ComplaintStatus, { ar: string; en: string }> = {
  [ComplaintStatus.NEW]: {
    ar: 'شكراً لتواصلك معنا، تم تسجيل شكواك بنجاح وستتم مراجعتها من قبل الفريق المختص في أقرب وقت ممكن.',
    en: 'Thank you for reaching out. Your complaint has been successfully registered and will be reviewed by our team as soon as possible.',
  },
  [ComplaintStatus.IN_REVIEW]: {
    ar: 'يقوم فريقنا المختص حالياً بدراسة شكواك بعناية لضمان معالجتها بالشكل الأمثل.',
    en: 'Our dedicated team is currently reviewing your complaint carefully to ensure it is handled appropriately.',
  },
  [ComplaintStatus.IN_PROGRESS]: {
    ar: 'نود إعلامك بأن فريقنا يعمل جاهداً على معالجة شكواك وسنوافيك بالمستجدات قريباً.',
    en: 'We would like to inform you that our team is actively working on resolving your complaint and will update you shortly.',
  },
  [ComplaintStatus.NEED_MORE_INFO]: {
    ar: 'لمتابعة معالجة شكواك بالشكل المطلوب، نرجو منك تزويدنا ببعض المعلومات الإضافية عبر التطبيق.',
    en: 'To proceed with your complaint effectively, we kindly request you to provide additional information through the app.',
  },
  [ComplaintStatus.RESOLVED]: {
    ar: 'يسعدنا إبلاغك بأنه تم معالجة شكواك بنجاح. نشكرك على ثقتك بنا ونتطلع لخدمتك دائماً.',
    en: 'We are pleased to inform you that your complaint has been successfully resolved. Thank you for your trust, and we look forward to serving you.',
  },
  [ComplaintStatus.REJECTED]: {
    ar: 'نأسف لإبلاغك بأنه تعذر قبول شكواك. يمكنك الاطلاع على تفاصيل القرار من خلال التطبيق.',
    en: 'We regret to inform you that your complaint could not be accepted. You may view the decision details through the app.',
  },
  [ComplaintStatus.CANCELLED]: {
    ar: 'تم إلغاء شكواك بناءً على طلبك. في حال رغبتك بتقديم شكوى جديدة، نحن هنا لمساعدتك.',
    en: 'Your complaint has been cancelled as per your request. Should you wish to submit a new complaint, we are here to assist you.',
  },
};

function buildNotificationContent(
  complaintId: number,
  oldStatus: ComplaintStatus | null,
  newStatus: ComplaintStatus,
  lang: NotificationLang = 'ar',
): { title: string; body: string } {
  const newStatusText = STATUS_TRANSLATIONS[newStatus][lang];
  const details = STATUS_DETAILS[newStatus][lang];

  const title =
    lang === 'ar'
      ? `شكوى رقم ${complaintId} - ${newStatusText}`
      : `Complaint #${complaintId} - ${newStatusText}`;

  return { title, body: details };
}

export async function sendStatusChangeNotification(
  notificationService: NotificationService,
  citizensService: CitizensAdminService,
  citizenId: number,
  complaintId: number,
  newStatus: ComplaintStatus,
  oldStatus: ComplaintStatus | null = null,
  lang: NotificationLang = 'ar',
): Promise<void> {
  try {
    const citizen = await citizensService.findOne(citizenId);

    if (!citizen?.fcmToken) {
      return;
    }

    const { title, body } = buildNotificationContent(complaintId, oldStatus, newStatus, lang);

    await notificationService.sendToToken({
      token: citizen.fcmToken,
      title,
      body,
      data: {
        complaintId: complaintId.toString(),
        oldStatus: oldStatus || '',
        newStatus: newStatus,
        type: 'status_change',
      },
    });
  } catch (error: any) {
    handleNotificationError(error, citizensService, citizenId);
  }
}

async function handleNotificationError(
  error: any,
  citizensService: CitizensAdminService,
  citizenId: number,
) {
  const isInvalidToken = error?.message?.includes(
    'The registration token is not a valid FCM registration token',
  );
  if (isInvalidToken) {
    await citizensService.update(citizenId, { fcmToken: null });
  }
}
