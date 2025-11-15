import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';
import { AppJwtService } from '../../shared/modules/app-jwt/app-jwt.service';
import { DecodedAccessTokenPayload } from '../../shared/modules/app-jwt/interfaces';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: AppJwtService,
    private readonly usersService: any, //TODO: Add type for the users service
    private readonly translateHelper: TranslateHelper,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(
        this.translateHelper.tr('guards.errors.access_token_required'),
      );
    }

    // Verify the token
    const payload: DecodedAccessTokenPayload = this.jwtService.verifyAccessToken(token);

    // Check if user exists and is active
    const user = await this.usersService.findOne(payload.userId);

    if (user.passwordChangedAt) {
      const passwordChangedAtSec = Math.floor(new Date(user.passwordChangedAt).getTime() / 1000);
      if (payload.iat < passwordChangedAtSec) {
        throw new UnauthorizedException(
          this.translateHelper.tr('guards.errors.token_issued_before_password_change'),
        );
      }
    }

    if (user.lastLogin) {
      const lastLoginSec = Math.floor(new Date(user.lastLogin).getTime() / 1000);
      if (payload.iat < lastLoginSec) {
        throw new UnauthorizedException(
          this.translateHelper.tr('guards.errors.token_issued_before_login'),
        );
      }
    }

    // Attach user info to request for use in controllers
    request.user = user;

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
