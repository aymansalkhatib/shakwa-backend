import { ComplaintStatus } from '../..';

export interface ICreateComplaintHistoryData {
  complaintId: number;
  internalUserId?: number | null;

  title: string;
  description: string;
  status: ComplaintStatus;

  location?: string | null;
  attachments?: string[];
  citizenNote?: string | null;
  internalUserNote?: string | null;
}
