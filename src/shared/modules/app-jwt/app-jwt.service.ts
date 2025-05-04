import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { EnvironmentConfig } from '../app-config/env.schema';
import {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair,
  VerificationTokenPayload,
} from './strategies/interfaces/token-payloads.interface';

@Injectable()
export class AppJwtService {
  private readonly accessSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;
  private readonly verificationSecret: string;
  private readonly verificationExpiresIn: string;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    this.accessSecret = this.configService.getOrThrow('JWT_ACCESS_SECRET');
    this.accessExpiresIn = this.configService.getOrThrow('JWT_ACCESS_EXPIRES_IN');
    this.refreshSecret = this.configService.getOrThrow('JWT_REFRESH_SECRET');
    this.refreshExpiresIn = this.configService.getOrThrow('JWT_REFRESH_EXPIRES_IN');
    this.verificationSecret = this.configService.getOrThrow('JWT_VERIFICATION_SECRET');
    this.verificationExpiresIn = this.configService.getOrThrow('JWT_VERIFICATION_EXPIRES_IN');
  }

  createAccessToken(payload: AccessTokenPayload): string {
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiresIn });
  }

  private createRefreshToken(payload: RefreshTokenPayload): string {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshExpiresIn });
  }

  createVerificationToken(payload: VerificationTokenPayload): string {
    return jwt.sign(payload, this.verificationSecret, { expiresIn: this.verificationExpiresIn });
  }

  verifyAccessToken(token: string, ignoreExpiration = false): any {
    try {
      return jwt.verify(token, this.accessSecret);
    } catch (error: any) {
      if (error.name === 'TokenExpiredError' && ignoreExpiration) {
        const decoded = jwt.decode(token);
        if (decoded) {
          return decoded;
        }
      }
      throw new UnauthorizedException('Invalid or expired Access Token');
    }
  }

  verifyRefreshToken(token: string): any {
    try {
      return jwt.verify(token, this.refreshSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired Refresh Token');
    }
  }

  verifyVerificationToken(token: string): any {
    try {
      return jwt.verify(token, this.verificationSecret);
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired Verification Token');
    }
  }

  generateTokens(payload: AccessTokenPayload & RefreshTokenPayload): TokenPair {
    const accessToken = this.createAccessToken(payload);
    const refreshToken = this.createRefreshToken(payload);
    return { accessToken, refreshToken };
  }
}
