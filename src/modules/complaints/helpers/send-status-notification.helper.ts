import { NotificationService } from '../../../shared/services/notifications/notification.service';
import { CitizensAdminService } from '../../citizens/services/citizens-admin.service';
import { ComplaintStatus } from '../enums';

const STATUS_MESSAGES: Record<ComplaintStatus, string> = {
  [ComplaintStatus.NEW]: 'Complaint Received',
  [ComplaintStatus.IN_REVIEW]: 'Complaint Under Review',
  [ComplaintStatus.IN_PROGRESS]: 'Complaint In Progress',
  [ComplaintStatus.NEED_MORE_INFO]: 'More Information Needed',
  [ComplaintStatus.RESOLVED]: 'Complaint Resolved',
  [ComplaintStatus.REJECTED]: 'Complaint Rejected',
  [ComplaintStatus.CANCELLED]: 'Complaint Cancelled',
};

export async function sendStatusChangeNotification(
  notificationService: NotificationService,
  citizensService: CitizensAdminService,
  citizenId: number,
  complaintId: number,
  newStatus: ComplaintStatus,
): Promise<void> {
  try {
    const citizen = await citizensService.findOne(citizenId);

    if (!citizen?.fcmToken) {
      return;
    }

    const title = 'Complaint Status Update';
    const body = STATUS_MESSAGES[newStatus] || 'Your complaint status has been updated';

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
  } catch (error: any) {
    handleNotificationError(error, citizensService, citizenId);
  }
}

async function handleNotificationError(
  error: any,
  citizensService: CitizensAdminService,
  citizenId: number,
) {
  const isInvalidToken =
    error?.message?.includes('not-found') ||
    error?.message?.includes('invalid-registration-token') ||
    error?.message?.includes('registration-token-not-registered');

  if (isInvalidToken) {
    await citizensService.update(citizenId, { fcmToken: null });
  }
}
