import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CitizenResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string | null;

  @Expose()
  phone: string | null;

  @Expose()
  fullName: string;

  @Expose()
  blockedAt: Date | null;

  @Expose()
  lastLoginAt: Date | null;

  @Expose()
  lastLoginIp: string | null;

  @Expose()
  passwordChangedAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
