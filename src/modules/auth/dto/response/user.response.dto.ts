import { Exclude, Expose } from 'class-transformer';
import { UserRole } from 'src/common/enums/role.enum';

@Exclude()
export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  roles: UserRole[];

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  securityToken: string | null;

  passwordChangedAt: Date | null;

  verifiedAt: Date | null;

  blockedAt: Date | null;

  sessionNumber: number;

  deletedAt: Date | null;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}