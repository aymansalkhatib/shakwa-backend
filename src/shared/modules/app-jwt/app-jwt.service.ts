// File: src/shared/modules/app-jwt/app-jwt.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvironmentConfig } from '../app-config/env.schema';
import { TranslateHelper } from '../app-i18n/translate.helper';
import {
  AccessTokenPayload,
  DecodedAccessTokenPayload,
  DecodedRefreshTokenPayload,
  DecodedSecurityTokenPayload,
  RefreshTokenPayload,
  SecurityTokenPayload,
} from './interfaces';

/**
 * Service for handling JWT operations including token creation, verification and management
 */
@Injectable()
export class AppJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresInMs: number;
  private readonly refreshSecret: string;
  private readonly refreshExpiresInMs: number;
  private readonly securitySecret: string;
  private readonly securityExpiresInMs: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly translateHelper: TranslateHelper,
  ) {
    this.accessSecret = this.configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.accessExpiresInMs = this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN_MS');

    this.refreshSecret = this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    this.refreshExpiresInMs = this.configService.getOrThrow<number>('JWT_REFRESH_EXPIRES_IN_MS');

    this.securitySecret = this.configService.getOrThrow<string>('JWT_SECURITY_SECRET');
    this.securityExpiresInMs = this.configService.getOrThrow<number>('JWT_SECURITY_EXPIRES_IN_MS');
  }

  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: Math.floor(this.accessExpiresInMs / 1000), // ms → s
    });
  }

  createRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: Math.floor(this.refreshExpiresInMs / 1000), // ms → s
    });
  }

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
        this.translateHelper.tr('auth.errors.invalid_or_expired_token'),
      );
    }
  }

  verifyRefreshToken(token: string, ignoreExpiration = false): DecodedRefreshTokenPayload {
    try {
      return jwt.verify(token, this.refreshSecret, {
        ignoreExpiration,
      }) as DecodedAccessTokenPayload;
    } catch {
      throw new UnauthorizedException(
        this.translateHelper.tr('auth.errors.invalid_or_expired_token'),
      );
    }
  }

  decodeToken(token: string): DecodedAccessTokenPayload | null {
    const decoded = jwt.decode(token);
    return decoded as DecodedAccessTokenPayload | null;
  }

  /**
   * Creates a security token for email verification and password reset
   * Uses a dedicated security secret and expiration time for enhanced security.
   */
  createSecurityToken(payload: SecurityTokenPayload): string {
    return jwt.sign(payload, this.securitySecret, {
      expiresIn: Math.floor(this.securityExpiresInMs / 1000), // ms → s
    });
  }

  /**
   * Verifies a security token (email verification / password reset)
   */
  verifySecurityToken(token: string, ignoreExpiration = false): DecodedSecurityTokenPayload {
    try {
      return jwt.verify(token, this.securitySecret, {
        ignoreExpiration,
      }) as DecodedSecurityTokenPayload;
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' && ignoreExpiration) {
        const decoded = jwt.decode(token);
        if (decoded) {
          return decoded as DecodedSecurityTokenPayload;
        }
      }

      throw new UnauthorizedException(
        this.translateHelper.tr('auth.errors.invalid_or_expired_token'),
      );
    }
  }
}
