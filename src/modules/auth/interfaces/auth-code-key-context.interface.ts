import { Role } from '../../../common/enums/role.enum';
import { AuthCodePurpose } from '../enums/auth-code-purpose.enum';

export interface IAuthCodeKeyContext {
  role: Role;
  email: string;
  purpose: AuthCodePurpose;
}
