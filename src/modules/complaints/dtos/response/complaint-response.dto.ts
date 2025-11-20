import { Exclude, Expose } from 'class-transformer';
import { ComplaintAuthority, ComplaintCategory, ComplaintStatus } from '../..';

@Exclude()
export class ComplaintResponseDto {
  @Expose()
  id: number;

  @Expose()
  citizenId: number;

  @Expose()
  category: ComplaintCategory;

  @Expose()
  authority: ComplaintAuthority;

  @Expose()
  lockedByInternalUserId: number | null;

  @Expose()
  lockedAt: Date | null;

  @Expose()
  createdAt: Date;

  // Snapshot fields from latest history
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
  lastHistoryAt: Date;
}
