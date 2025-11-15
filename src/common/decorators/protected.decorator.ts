import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from '../enums/role.enum';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

export const ROLES_KEY = 'roles';

export function Protected(...roles: Role[]) {
  return applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(JwtAuthGuard));
}
