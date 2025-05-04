import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ROLE_HIERARCHY, UserRole } from '../enums/role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    return this.matchRoles(requiredRoles, user.roles);
  }

  private matchRoles(
    requiredRoles: UserRole[],
    userRoles: UserRole[],
  ): boolean {
    return requiredRoles.some((required) =>
      userRoles.some((userRole) => this.hasRole(userRole, required)),
    );
  }

  private hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
    if (userRole === requiredRole) {
      return true;
    }

    const hierarchy = ROLE_HIERARCHY[userRole] || [];
    return hierarchy.includes(requiredRole);
  }
}
