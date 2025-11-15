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
  private readonly accessExpiresInMs: number;
  private readonly refreshSecret?: string;
  private readonly refreshExpiresInMs?: number;

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly translateHelper: TranslateHelper,
  ) {
    this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
    this.accessExpiresInMs = this.configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN_MS');
    this.refreshSecret = this.configService.get('JWT_REFRESH_SECRET');
    this.refreshExpiresInMs = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_MS');
  }

  /**
   * Creates an access token for user authentication
   * @param payload User information to include in token
   * @returns Signed JWT access token
   */
  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, {
      expiresIn: Math.floor(this.accessExpiresInMs / 1000), // Convert ms to seconds
    });
  }

  /**
   * Creates a refresh token for user authentication
   * @param payload User information to include in token
   * @returns Signed JWT refresh token
   */
  createRefreshToken(payload: AccessTokenPayload): string {
    if (!this.refreshSecret || !this.refreshExpiresInMs) {
      throw new Error('Refresh token configuration is missing');
    }

    return jwt.sign(payload, this.refreshSecret, {
      expiresIn: Math.floor(this.refreshExpiresInMs / 1000), // Convert ms to seconds
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

  /**
   * Verifies a refresh token's validity
   * @param token Refresh token to verify
   * @param ignoreExpiration Whether to ignore token expiration
   * @returns Decoded token payload if valid
   * @throws UnauthorizedException if token is invalid
   */
  verifyRefreshToken(token: string, ignoreExpiration = false): DecodedAccessTokenPayload {
    if (!this.refreshSecret) {
      throw new Error('Refresh token configuration is missing');
    }

    try {
      return jwt.verify(token, this.refreshSecret, {
        ignoreExpiration,
      }) as DecodedAccessTokenPayload;
    } catch (error: any) {
      throw new UnauthorizedException(
        this.translateHelper.tr('auth.errors.invalid_or_expired_access_token'),
      );
    }
  }

  /**
   * Decodes a token without verifying its signature
   * @param token Token to decode
   * @returns Decoded token payload or null if invalid
   */
  decodeToken(token: string): DecodedAccessTokenPayload | null {
    const decoded = jwt.decode(token);
    return decoded as DecodedAccessTokenPayload | null;
  }
}
