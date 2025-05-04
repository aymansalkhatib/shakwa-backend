import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from 'src/modules/auth/auth.service';
import { EnvironmentConfig } from '../../app-config/env.schema';
import { UserResponseDto } from 'src/modules/auth/dto/auth.response.dto';
import { AccessTokenPayload } from './interfaces/token-payloads.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: AccessTokenPayload) {
    const user: UserResponseDto = await this.authService.validateUser(payload.userId);

    if (!user) {
      // Custom error: User not found
      throw new UnauthorizedException({
        errorCode: 'USER_NOT_FOUND',
      });
    }

    if (!user.verifiedAt) {
      // Custom error: Email not verified
      throw new UnauthorizedException({
        errorCode: 'EMAIL_NOT_VERIFIED',
      });
    }

    if (user.blockedAt) {
      // Custom error: User is blocked
      throw new UnauthorizedException({
        errorCode: 'USER_BLOCKED',
      });
    }

    if (user.deletedAt) {
      // Custom error: User is blocked
      throw new UnauthorizedException({
        errorCode: 'USER_DELETED',
      });
    }

    // If everything is valid, return the user
    user.sessionNumber = payload.sessionNumber;
    return user;
  }
}
