import { Logger } from '@nestjs/common';
import { NotificationService } from '../../../shared/services/notifications/notification.service';
import { CitizensAdminService } from '../../citizens/services/citizens-admin.service';
import { ComplaintStatus } from '../enums';

const logger = new Logger('StatusNotificationHelper');

export async function sendStatusChangeNotification(
  notificationService: NotificationService,
  citizensService: CitizensAdminService,
  citizenId: number,
  complaintId: number,
  newStatus: ComplaintStatus,
): Promise<void> {
  try {
    // Get citizen with FCM token
    const citizen = await citizensService.findOne(citizenId);

    // If no FCM token, skip notification
    if (!citizen?.fcmToken) {
      logger.debug(`Citizen ${citizenId} has no FCM token, skipping notification`);
      return;
    }

    // Prepare notification message
    const statusMessages: Record<ComplaintStatus, string> = {
      [ComplaintStatus.NEW]: 'تم استلام شكواك',
      [ComplaintStatus.IN_REVIEW]: 'شكواك قيد المراجعة',
      [ComplaintStatus.IN_PROGRESS]: 'جاري العمل على شكواك',
      [ComplaintStatus.NEED_MORE_INFO]: 'نحتاج المزيد من المعلومات حول شكواك',
      [ComplaintStatus.RESOLVED]: 'تم حل شكواك',
      [ComplaintStatus.REJECTED]: 'تم رفض شكواك',
      [ComplaintStatus.CANCELLED]: 'تم إلغاء شكواك',
    };

    const title = 'تحديث حالة الشكوى';
    const body = statusMessages[newStatus] || 'تم تحديث حالة شكواك';

    // Send notification
    await notificationService.sendToToken({
      token: citizen.fcmToken,
      title,
      body,
      data: {
        complaintId: complaintId.toString(),
        status: newStatus,
        type: 'status_change',
      },
    });

    logger.log(`Notification sent to citizen ${citizenId} for complaint ${complaintId}`);
  } catch (error: any) {
    logger.error(`Failed to send notification to citizen ${citizenId}:`, error);

    // If error is related to invalid token, delete it
    if (
      error?.message?.includes('not-found') ||
      error?.message?.includes('invalid-registration-token') ||
      error?.message?.includes('registration-token-not-registered')
    ) {
      try {
        logger.warn(`Deleting invalid FCM token for citizen ${citizenId}`);
        await citizensService.update(citizenId, { fcmToken: null });
      } catch (updateError) {
        logger.error(`Failed to delete invalid token for citizen ${citizenId}:`, updateError);
      }
    }
  }
}
