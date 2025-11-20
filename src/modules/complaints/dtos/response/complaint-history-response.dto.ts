import { Exclude, Expose } from 'class-transformer';
import { ComplaintStatus } from '../../enums';
import { InternalUserResponseDto } from '@app/modules/internal-users/dtos';
import { PublicInternalUserResponseDto } from '@app/modules/internal-users/dtos/response/public-internal-user-response';

@Exclude()
export class ComplaintHistoryResponseDto {
  @Expose()
  id: number;

  @Expose()
  complaintId: number;

  @Expose()
  internalUserId: number | null;

  @Expose()
  internalUser: PublicInternalUserResponseDto;

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
