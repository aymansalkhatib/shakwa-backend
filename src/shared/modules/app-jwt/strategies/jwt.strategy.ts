import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../../app-config/env.schema';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/modules/users/entities/base/user.entity';
import { Session } from 'src/modules/auth/session.entity';
import { AppJwtService } from '../app-jwt.service';
import { JwtErrorCode } from '../guards/jwt-auth.guard';
import { DecodedAccessTokenPayload } from '../interfaces';

/**
 * JWT Strategy for Passport authentication
 * Validates JWT tokens and ensures user and session are valid
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,

    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,

    readonly configService: ConfigService<EnvironmentConfig>,
    readonly appJwtService: AppJwtService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_ACCESS_SECRET'),
    });
  }

  /**
   * Validates the JWT payload and ensures user and session are valid
   * @param payload JWT payload from token
   * @returns User object if validation successful
   * @throws UnauthorizedException with appropriate error code if validation fails
   */
  async validate(payload: DecodedAccessTokenPayload) {
    // 1. Validate session
    await this.validateSession(payload);

    // 2. Validate user
    const user = await this.validateUser(payload);

    // 3. Set session number on user object
    user.sessionNumber = payload.sessionNumber;

    return user;
  }

  /**
   * Validates that the session exists and is active
   * @param payload JWT payload
   * @throws UnauthorizedException if session is invalid
   */
  private async validateSession(payload: DecodedAccessTokenPayload): Promise<void> {
    const session = await this.sessionRepository.findOne({
      where: { userId: payload.userId, sessionNumber: payload.sessionNumber },
    });

    if (!session) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.SESSION_NOT_FOUND,
        message: 'Session not found or has been revoked',
      });
    }

    if (session.revokedAt) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.SESSION_REVOKED,
        message: 'This session has been revoked',
      });
    }

    if (session.isExpired()) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.SESSION_EXPIRED,
        message: 'Your session has expired',
      });
    }

    // Update last active timestamp (only if it's been more than 5 minutes)
    const fiveMinutes = 5 * 60 * 1000;
    if (!session.lastActiveAt || Date.now() - session.lastActiveAt.getTime() > fiveMinutes) {
      session.updateLastActive();
      await this.sessionRepository.save(session);
    }
  }

  /**
   * Validates that the user exists and is in good standing
   * @param payload JWT payload
   * @returns User object if valid
   * @throws UnauthorizedException if user is invalid
   */
  private async validateUser(payload: DecodedAccessTokenPayload): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.USER_NOT_FOUND,
        message: 'User not found',
      });
    }

    if (!user.verifiedAt) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.EMAIL_NOT_VERIFIED,
        message: 'Email not verified',
      });
    }

    if (user.blockedAt) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.USER_BLOCKED,
        message: 'User is blocked',
      });
    }

    if (user.deletedAt) {
      throw new UnauthorizedException({
        errorCode: JwtErrorCode.USER_DELETED,
        message: 'User has been deleted',
      });
    }

    // Check if token was issued before password change
    const tokenIssuedAt = (payload as any).iat * 1000; // Convert to milliseconds
    if (user.passwordChangedAt && tokenIssuedAt < user.passwordChangedAt.getTime()) {
      throw new UnauthorizedException({
        errorCode: 'PASSWORD_CHANGED',
        message: 'Password has been changed. Please log in again.',
      });
    }

    return user;
  }
}
