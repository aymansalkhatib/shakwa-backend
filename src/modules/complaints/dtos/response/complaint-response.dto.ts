import { Exclude, Expose, Type } from 'class-transformer';
import { ComplaintAuthority, ComplaintCategory, ComplaintHistoryResponseDto } from '../..';
import { CitizenResponseDto } from '../../../citizens/dtos';

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
  lockedUntil: Date | null;

  @Expose()
  createdAt: Date;

  @Expose()
  @Type(() => ComplaintHistoryResponseDto)
  histories: ComplaintHistoryResponseDto[];

  @Expose()
  @Type(() => CitizenResponseDto)
  citizen: CitizenResponseDto | null;
}
