import 'express';
import { Role } from '../common/enums/role.enum';
import { CitizenEntity } from '../modules/citizens/entities/citizen.entity';
import { InternalUserEntity } from '../modules/internal-users/entities/internal-user.entity';

declare global {
  namespace Express {
    interface Request {
      user?: InternalUserEntity | CitizenEntity;
      role?: Role;
    }
  }
}
