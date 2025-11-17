import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { InternalRole } from '../../../common/enums/role.enum';
import { EnvironmentConfig } from '../../../shared/modules/app-config';
import { AppJwtService } from '../../../shared/modules/app-jwt/app-jwt.service';
import { InternalUserResponseDto } from '../../internal-users/dtos/response/internal-user-response.dto';
import { InternalUsersService } from '../../internal-users/services/internal-users.service';
import { InternalUserForgotPasswordDto } from '../dtos/request/internal-users/forgot-password.dto';
import { InternalUserLoginDto } from '../dtos/request/internal-users/internal-user-login.dto';
import { InternalUserResetPasswordDto } from '../dtos/request/internal-users/reset-password.dto';
import { InternalUserVerifyResetPasswordDto } from '../dtos/request/internal-users/verify-reset-password.dto';
import { AuthCodeKeyContext, AuthCodePurpose, AuthCodeService } from './auth-code.service';

@Injectable()
export class InternalUsersAuthService {
  private readonly passwordResetTtlSeconds: number;

  constructor(
    private readonly jwtService: AppJwtService,
    private readonly internalUsersService: InternalUsersService,
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly authCodeService: AuthCodeService,
  ) {
    const ttlMs = this.configService.getOrThrow<number>('JWT_SECURITY_EXPIRES_IN_MS');
    this.passwordResetTtlSeconds = Math.ceil(ttlMs / 1000);
  }

  async login(loginDto: InternalUserLoginDto, ip: string) {
    const { email, password, fcmToken } = loginDto;
    const internalUser = await this.internalUsersService.findByEmail(email);

    if (!internalUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, internalUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login - directly update the entity with FCM token and IP
    await this.internalUsersService.updateLastLoginAt(internalUser, fcmToken, ip);

    const token = this.jwtService.createAccessToken({
      userId: internalUser.id,
      role: internalUser.role,
    });

    return {
      token,
      internalUser: plainToInstance(InternalUserResponseDto, internalUser),
    };
  }

  async handleForgotPasswordRequest(dto: InternalUserForgotPasswordDto) {
    const internalUser = await this.internalUsersService.findByEmailOrFail(dto.email);
    await this.sendPasswordResetCode(dto.email, internalUser.role);
  }

  async verifyResetPassword(dto: InternalUserVerifyResetPasswordDto): Promise<{ token: string }> {
    const internalUser = await this.internalUsersService.findByEmailOrFail(dto.email);

    await this.authCodeService.verifyCode({
      ...this.buildContext(dto.email, internalUser.role, AuthCodePurpose.PASSWORD_RESET_CODE),
      code: dto.code,
      errorMessage: 'Invalid reset code',
    });
    await this.authCodeService.cacheCode({
      ...this.buildContext(dto.email, internalUser.role, AuthCodePurpose.PASSWORD_RESET_TOKEN),
      code: dto.code,
      ttlSeconds: this.passwordResetTtlSeconds,
    });

    // Create security token for password reset
    const token = this.jwtService.createSecurityToken({
      email: dto.email,
      code: dto.code,
      type: 'password_reset',
    });

    return { token };
  }

  async resetPassword(dto: InternalUserResetPasswordDto) {
    // Verify the security token
    const decodedToken = this.jwtService.verifySecurityToken(dto.token);

    // Check if token type is password_reset
    if (decodedToken.type !== 'password_reset') {
      throw new BadRequestException('Invalid token type for password reset');
    }

    // Find internal user by email from token
    const internalUser = await this.internalUsersService.findByEmailOrFail(decodedToken.email);

    // Verify code in Redis matches token
    await this.authCodeService.verifyCode({
      ...this.buildContext(
        decodedToken.email,
        internalUser.role,
        AuthCodePurpose.PASSWORD_RESET_TOKEN,
      ),
      code: decodedToken.code,
      errorMessage: 'Invalid or expired reset password code',
      consume: false,
    });

    // Update password
    await this.internalUsersService.updateMyAccount(internalUser, {
      password: dto.newPassword,
    });

    // Clean up Redis reset data
    await this.authCodeService.clearCode(
      this.buildContext(
        decodedToken.email,
        internalUser.role,
        AuthCodePurpose.PASSWORD_RESET_TOKEN,
      ),
    );
  }

  // PRIVATE METHODS - Password Reset
  private async sendPasswordResetCode(email: string, role: InternalRole) {
    await this.authCodeService.clearCode(
      this.buildContext(email, role, AuthCodePurpose.PASSWORD_RESET_TOKEN),
    );

    const code = await this.authCodeService.generateCode({
      ...this.buildContext(email, role, AuthCodePurpose.PASSWORD_RESET_CODE),
      ttlSeconds: this.passwordResetTtlSeconds,
    });

    await this.authCodeService.sendCodeViaEmail(email, code, 'Internal Password Reset');
  }

  private buildContext(email: string, role: any, purpose: AuthCodePurpose): AuthCodeKeyContext {
    return { role, email, purpose };
  }
}
