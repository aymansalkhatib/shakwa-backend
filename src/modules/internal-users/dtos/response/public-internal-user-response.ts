import { Exclude, Expose } from 'class-transformer';
import { InternalRole } from '../../../../common/enums/role.enum';
import { InternalUserEntity } from '../../entities/internal-user.entity';
import { ComplaintAuthority } from '@app/modules/your-bucket-name';

@Exclude()
export class PublicInternalUserResponseDto {
  @Expose()
  id: number;

  @Expose()
  role: InternalRole;

  @Expose()
  fullName: string;

  @Expose()
  authority: ComplaintAuthority;

  constructor(internalUser: InternalUserEntity) {
    return Object.assign(this, internalUser);
  }
}
