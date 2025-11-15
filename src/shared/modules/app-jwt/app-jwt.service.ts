import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvironmentConfig } from '../app-config/env.schema';
import { TranslateHelper } from '../app-i18n/translate.helper';
import { AccessTokenPayload, DecodedAccessTokenPayload } from './interfaces';

/**
 * Service for handling JWT operations including token creation, verification and management
 */
@Injectable()
export class AppJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly translateHelper: TranslateHelper,
  ) {
    this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
    this.accessExpiresIn = this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN_MS');
  }

  /**
   * Creates an access token for user authentication
   * @param payload User information to include in token
   * @returns Signed JWT access token
   */
  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: this.accessExpiresIn,
    });
  }

  /**
   * Verifies an access token's validity
   * @param token Access token to verify
   * @param ignoreExpiration Whether to ignore token expiration
   * @returns Decoded token payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  verifyAccessToken(token: string, ignoreExpiration = false): DecodedAccessTokenPayload {
    try {
      return jwt.verify(token, this.accessSecret, {
        ignoreExpiration,
      }) as DecodedAccessTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' && ignoreExpiration) {
        const decoded = jwt.decode(token);
        if (decoded) {
          return decoded as DecodedAccessTokenPayload;
        }
      }
      throw new UnauthorizedException(
        this.translateHelper.tr('auth.errors.invalid_or_expired_access_token'),
      );
    }
  }
}
