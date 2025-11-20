import { Exclude, Expose, Type } from 'class-transformer';
import { ComplaintAuthority, ComplaintCategory, ComplaintHistoryResponseDto } from '../..';

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
  lockedUntil: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => ComplaintHistoryResponseDto)
  histories: ComplaintHistoryResponseDto[];
}
