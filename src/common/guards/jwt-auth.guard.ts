import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { Request } from 'express';
import { CITIZENS_REPOSITORY_TOKEN } from '../../modules/citizens/constants/citizens.tokens';
import { CitizenEntity } from '../../modules/citizens/entities/citizen.entity';
import { ICitizensRepository } from '../../modules/citizens/repositories/citizens.repository.interface';
import { InternalUserEntity } from '../../modules/internal-users/entities/internal-user.entity';
import { InternalUsersService } from '../../modules/internal-users/services/internal-users.service';
import { AppJwtService } from '../../shared/modules/app-jwt/app-jwt.service';
import { DecodedAccessTokenPayload } from '../../shared/modules/app-jwt/interfaces';
import { ROLES_KEY } from '../decorators/protected.decorator';
import { Role } from '../enums/role.enum';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: AppJwtService,
    private moduleRef: ModuleRef,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException('Authorization token not found.');
    }

    const payload: DecodedAccessTokenPayload = this.jwtService.verifyAccessToken(token);

    // Check role if required roles are specified
    if (requiredRoles && requiredRoles.length !== 0) {
      if (!payload.role || !requiredRoles.includes(payload.role as Role)) {
        throw new ForbiddenException('Your role does not authorize you to perform this action.');
      }
    }

    let user: CitizenEntity | InternalUserEntity | null = null;

    switch (payload.role) {
      case Role.CITIZEN:
        user = await this.validateCitizen(payload);
        break;
      case Role.ADMIN:
      case Role.STAFF:
        user = await this.validateInternalUser(payload);
        break;
      default:
        // If no role in token, try to determine from user type
        // This is for backward compatibility
        user = await this.validateUserWithoutRole(payload);
        break;
    }

    if (!user) {
      throw new UnauthorizedException('User not found.');
    }

    request.user = user;
    request.role = payload.role as Role | undefined;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async validateCitizen(payload: DecodedAccessTokenPayload): Promise<CitizenEntity | null> {
    const citizensRepository = this.moduleRef.get<ICitizensRepository>(CITIZENS_REPOSITORY_TOKEN, {
      strict: false,
    });
    const citizen = await citizensRepository.findOne(payload.userId);

    if (!citizen) {
      return null;
    }

    // Check if the citizen account is blocked
    if (citizen.blockedAt) {
      throw new UnauthorizedException('User account has been blocked.');
    }

    // Check if token was issued before the last login (invalidate old tokens after new login)
    if (this.isTokenIssuedBeforeEvent(payload.iat, citizen.lastLoginAt)) {
      throw new UnauthorizedException('Token expired due to new login session.');
    }

    // Check if token was issued before password was changed
    if (this.isTokenIssuedBeforeEvent(payload.iat, citizen.passwordChangedAt)) {
      throw new UnauthorizedException('Token was issued before the last password change.');
    }

    return citizen;
  }

  private async validateInternalUser(
    payload: DecodedAccessTokenPayload,
  ): Promise<InternalUserEntity | null> {
    const internalUsersService = this.moduleRef.get(InternalUsersService, { strict: false });
    const internalUser = await internalUsersService.findOne(payload.userId);

    if (!internalUser) {
      return null;
    }

    // Check if token was issued before password was changed
    if (this.isTokenIssuedBeforeEvent(payload.iat, internalUser.passwordChangedAt)) {
      throw new UnauthorizedException('Token was issued before the last password change.');
    }

    // Check if token was issued before the last login (invalidate old tokens after new login)
    if (this.isTokenIssuedBeforeEvent(payload.iat, internalUser.lastLoginAt)) {
      throw new UnauthorizedException('Token expired due to new login session.');
    }

    // Check if token was issued before the last logout (invalidate tokens after logout)
    if (this.isTokenIssuedBeforeEvent(payload.iat, internalUser.lastLogoutAt)) {
      throw new UnauthorizedException('Token expired due to user logout.');
    }

    return internalUser;
  }

  private async validateUserWithoutRole(
    payload: DecodedAccessTokenPayload,
  ): Promise<CitizenEntity | InternalUserEntity | null> {
    // Try citizen first
    try {
      const citizensRepository = this.moduleRef.get<ICitizensRepository>(
        CITIZENS_REPOSITORY_TOKEN,
        { strict: false },
      );
      const citizen = await citizensRepository.findOne(payload.userId);
      if (citizen) {
        return await this.validateCitizen(payload);
      }
    } catch (error) {
      // Citizen not found, try internal user
    }

    // Try internal user
    try {
      const internalUsersService = this.moduleRef.get(InternalUsersService, { strict: false });
      const internalUser = await internalUsersService.findOne(payload.userId);
      if (internalUser) {
        return await this.validateInternalUser(payload);
      }
    } catch (error) {
      // Internal user not found
    }

    return null;
  }

  private isTokenIssuedBeforeEvent(
    tokenIssuedAt?: number,
    eventDate?: Date | string | null,
  ): boolean {
    if (!eventDate || !tokenIssuedAt) return false;

    const eventTimestamp = new Date(eventDate).getTime() / 1000;

    return tokenIssuedAt < Math.floor(eventTimestamp);
  }
}
