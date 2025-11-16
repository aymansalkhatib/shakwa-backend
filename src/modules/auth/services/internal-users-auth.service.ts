import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { InternalRole } from '../../../common/enums/role.enum';
import { AppJwtService } from '../../../shared/modules/app-jwt/app-jwt.service';
import { RedisService } from '../../../shared/services/redis/redis.service';
import { InternalUserResponseDto } from '../../internal-users/dtos/response/internal-user-response.dto';
import { InternalUsersService } from '../../internal-users/services/internal-users.service';
import { InternalUserForgotPasswordDto } from '../dtos/request/internal-users/forgot-password.dto';
import { InternalUserLoginDto } from '../dtos/request/internal-users/internal-user-login.dto';
import { InternalUserResetPasswordDto } from '../dtos/request/internal-users/reset-password.dto';
import { InternalUserVerifyResetPasswordDto } from '../dtos/request/internal-users/verify-reset-password.dto';

@Injectable()
export class InternalUsersAuthService {
  constructor(
    private readonly jwtService: AppJwtService,
    private readonly redisService: RedisService,
    private readonly internalUsersService: InternalUsersService,
  ) {}

  async login(loginDto: InternalUserLoginDto) {
    const { email, password } = loginDto;
    const internalUser = await this.internalUsersService.findByEmail(email);

    if (!internalUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, internalUser.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last login - directly update the entity
    await this.internalUsersService.updateLastLoginAt(internalUser);

    const token = this.jwtService.createAccessToken({
      userId: internalUser.id,
      role: internalUser.role,
    });

    return {
      token,
      internalUser: Object.assign(new InternalUserResponseDto(internalUser), internalUser),
    };
  }

  async handleForgotPasswordRequest(dto: InternalUserForgotPasswordDto) {
    const internalUser = await this.internalUsersService.findByEmail(dto.email);
    if (!internalUser) {
      throw new BadRequestException('Email not found. Please contact administrator.');
    }
    await this.sendPasswordResetCode(dto.email, internalUser.role);
    return {
      message: 'Password reset code has been sent to your email. Please check your inbox.',
    };
  }

  async verifyResetPassword(dto: InternalUserVerifyResetPasswordDto) {
    const internalUser = await this.internalUsersService.findByEmail(dto.email);
    if (!internalUser) {
      throw new BadRequestException('Email not found. Please contact administrator.');
    }

    await this.verifyPasswordResetCode(dto.email, dto.code, internalUser.role);
    await this.cacheValidatedResetToken(dto.email, dto.code, internalUser.role);

    // Create security token for password reset
    const token = this.jwtService.createSecurityToken({
      email: dto.email,
      code: dto.code,
      type: 'password_reset',
    });

    return {
      token,
      message: 'Reset code verified successfully. You can now reset your password.',
    };
  }

  async resetPassword(dto: InternalUserResetPasswordDto) {
    // Verify the security token
    const decodedToken = this.jwtService.verifySecurityToken(dto.token);

    // Check if token type is password_reset
    if (decodedToken.type !== 'password_reset') {
      throw new BadRequestException('Invalid token type for password reset');
    }

    // Find internal user by email from token
    const internalUser = await this.internalUsersService.findByEmail(decodedToken.email);
    if (!internalUser) {
      throw new BadRequestException('Internal user not found.');
    }

    // Verify code in Redis matches token
    await this.validateResetPasswordToken(decodedToken.email, decodedToken.code, internalUser.role);

    // Update password
    await this.internalUsersService.updateMyAccount(internalUser, {
      password: dto.newPassword,
    });

    // Clean up Redis reset data
    await this.clearResetPasswordToken(decodedToken.email, internalUser.role);

    return { message: 'Your password has been successfully reset.' };
  }

  // PRIVATE METHODS - Password Reset
  private async sendPasswordResetCode(email: string, role: InternalRole) {
    const code = await this.generatePasswordResetCode(email, role);
    await this.clearResetPasswordToken(email, role);
    // Email will be sent using EmailService from mail module
    // For now, log the code (in development)
    console.log(`Password reset code for ${email}: ${code}`);
  }

  private async verifyPasswordResetCode(
    email: string,
    code: string,
    role: InternalRole,
  ): Promise<void> {
    const key = this.getResetCodeKey(email, role);
    const cachedCode = await this.redisService.getString(key);
    if (cachedCode !== code) {
      throw new BadRequestException('Invalid reset code');
    }
    await this.redisService.delete(key);
  }

  private async cacheValidatedResetToken(
    email: string,
    code: string,
    role: InternalRole,
  ): Promise<void> {
    const key = this.getResetTokenKey(email, role);
    await this.redisService.setString(key, code, 60 * 5); // 5 minutes
  }

  private async validateResetPasswordToken(
    email: string,
    code: string,
    role: InternalRole,
  ): Promise<void> {
    const key = this.getResetTokenKey(email, role);
    const cachedCode = await this.redisService.getString(key);
    if (!cachedCode || cachedCode !== code) {
      throw new BadRequestException('Invalid or expired reset password code');
    }
  }

  private async clearResetPasswordToken(email: string, role: InternalRole): Promise<void> {
    const key = this.getResetTokenKey(email, role);
    await this.redisService.delete(key);
  }

  // PRIVATE METHODS - Code Generation
  private async generatePasswordResetCode(email: string, role: InternalRole): Promise<string> {
    const code = this.generateRandomCode();
    const key = this.getResetCodeKey(email, role);
    await this.redisService.setString(key, code, 60 * 5); // 5 minutes
    return code;
  }

  private generateRandomCode(): string {
    const CODE_LENGTH = 6;
    const min = Math.pow(10, CODE_LENGTH - 1);
    const max = Math.pow(10, CODE_LENGTH) - 1;
    const code = Math.floor(min + Math.random() * (max - min + 1)).toString();
    console.log(code);
    return code;
  }

  // PRIVATE METHODS - Redis Keys
  private getResetCodeKey(email: string, role: InternalRole): string {
    return `${role}:restoration:email:${email}`;
  }

  private getResetTokenKey(email: string, role: InternalRole): string {
    return `${role}:restored:email:${email}`;
  }
}
