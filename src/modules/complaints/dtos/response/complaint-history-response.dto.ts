import { PublicInternalUserResponseDto } from '../../../internal-users/dtos/response/public-internal-user-response';
import { SignedUrl } from '../../../../shared/services/storage/decorators/signed-url.decorator';
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
  @SignedUrl({ isList: true, targetField: 'attachmentUrls' })
  attachments: string[];

  @Expose()
  attachmentUrls?: string[];

  @Expose()
  note: string | null;

  @Expose()
  createdAt: Date;
}
