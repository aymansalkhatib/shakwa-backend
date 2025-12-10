import { Exclude, Expose } from 'class-transformer';
import { InternalRole } from '../../../../common/enums/role.enum';
import { InternalUserEntity } from '../../entities/internal-user.entity';
import { ComplaintAuthority } from '../../../your-bucket-name';

@Exclude()
export class InternalUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  role: InternalRole;

  @Expose()
  fullName: string;

  @Expose()
  email: string;

  @Expose()
  authority?: ComplaintAuthority;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  passwordChangedAt: Date | null;

  @Expose()
  lastLoginAt: Date | null;

  @Expose()
  lastLogoutAt: Date | null;

  constructor(internalUser: InternalUserEntity) {
    return Object.assign(this, internalUser);
  }
}
