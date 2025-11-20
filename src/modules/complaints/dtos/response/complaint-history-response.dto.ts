import { Exclude, Expose } from 'class-transformer';
import { ComplaintStatus } from '../../enums';

@Exclude()
export class ComplaintHistoryResponseDto {
  @Expose()
  id: number;

  @Expose()
  complaintId: number;

  @Expose()
  internalUserId: number | null;

  @Expose()
  title: string;

  @Expose()
  description: string;

  @Expose()
  status: ComplaintStatus;

  @Expose()
  location: string | null;

  @Expose()
  attachments: string[];

  @Expose()
  note: string | null;

  @Expose()
  createdAt: Date;
}
