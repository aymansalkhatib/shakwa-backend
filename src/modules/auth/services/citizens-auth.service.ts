import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { Role } from '../../../common/enums/role.enum';
import { AppJwtService } from '../../../shared/modules/app-jwt/app-jwt.service';
import { RedisService } from '../../../shared/services/redis/redis.service';
import { CitizenResponseDto } from '../../citizens/dtos/response/citizen-response.dto';
import { CitizensService } from '../../citizens/services/citizens.service';
import { CitizenLoginDto } from '../dtos/request/citizens/citizen-login.dto';
import { CitizenRegisterDto } from '../dtos/request/citizens/citizen-register.dto';
import { ForgotPasswordDto } from '../dtos/request/citizens/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/request/citizens/reset-password.dto';
import { SendVerificationEmailDto } from '../dtos/request/citizens/send-verification-email.dto';
import { VerifyEmailCodeDto } from '../dtos/request/citizens/verify-email-code.dto';
import { VerifyResetPasswordDto } from '../dtos/request/citizens/verify-reset-password.dto';

@Injectable()
export class CitizensAuthService {
  constructor(
    private readonly citizensService: CitizensService,
    private readonly jwtService: AppJwtService,
    private readonly redisService: RedisService,
  ) {}

  async sendVerificationEmail(dto: SendVerificationEmailDto) {
    await this.ensureEmailNotVerified(dto.email);
    await this.sendEmailVerificationCode(dto.email);
    return { message: 'Verification code sent to your email' };
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    await this.ensureEmailNotVerified(dto.email);
    await this.verifyEmailVerificationCode(dto.email, dto.code);
    await this.cacheVerifiedEmailToken(dto.email, dto.code);
    const token = this.jwtService.createSecurityToken({
      code: dto.code,
      email: dto.email,
      type: 'email_verification',
    });
    return {
      token,
      message:
        'Email successfully verified. You have 5 minutes to register before you need to reverify.',
    };
  }

  async register(registerDto: CitizenRegisterDto) {
    // 1. Verify token and extract data
    const decodedToken = this.jwtService.verifySecurityToken(registerDto.token);

    // 2. Check if token type is email_verification
    if (decodedToken.type !== 'email_verification') {
      throw new BadRequestException('Invalid token type for registration');
    }

    // 3. Check if email in token matches email in request
    if (decodedToken.email !== registerDto.email) {
      throw new BadRequestException('Email in token does not match email in request');
    }

    // 4. Verify code in Redis
    await this.validateVerifiedEmailToken(registerDto.email, decodedToken.code);

    // 5. Check email and phone uniqueness
    if (registerDto.email) {
      const existingCitizen = await this.citizensService.findByEmail(registerDto.email);
      if (existingCitizen) {
        throw new BadRequestException('Citizen with this email already exists');
      }
    }

    if (registerDto.phone) {
      const existingCitizen = await this.citizensService.findByPhone(registerDto.phone);
      if (existingCitizen) {
        throw new BadRequestException('Citizen with this phone already exists');
      }
    }

    // 6. Create citizen
    const citizen = await this.citizensService.create(registerDto);

    // 7. Clean up Redis verification data
    await this.clearVerifiedEmailToken(registerDto.email);

    return {
      message: 'Citizen registered successfully. You can now login to your account.',
    };
  }

  async login(loginDto: CitizenLoginDto) {
    const citizen = await this.citizensService.findByEmail(loginDto.email);

    if (!citizen) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, citizen.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if citizen is blocked
    if (citizen.blockedAt) {
      throw new UnauthorizedException('Your account has been blocked. Please contact support.');
    }

    // Update last login
    await this.citizensService.updateLastLoginAt(citizen);

    const token = this.jwtService.createAccessToken({
      userId: citizen.id,
      role: Role.CITIZEN,
    });

    return {
      token,
      citizen: Object.assign(new CitizenResponseDto(), citizen),
    };
  }

  async handleForgotPasswordRequest(dto: ForgotPasswordDto) {
    const citizen = await this.citizensService.findByEmail(dto.email);
    if (!citizen) {
      throw new BadRequestException('Email not found. Please create an account first.');
    }
    await this.sendPasswordResetCode(citizen.email);
    return {
      message: 'Password reset code has been sent to your email. Please check your inbox.',
    };
  }

  async verifyResetPassword(dto: VerifyResetPasswordDto) {
    const citizen = await this.citizensService.findByEmail(dto.email);
    if (!citizen) {
      throw new BadRequestException('Email not found. Please create an account first.');
    }

    await this.verifyPasswordResetCode(dto.email, dto.code);
    await this.cacheValidatedResetToken(dto.email, dto.code);

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

  async resetPassword(dto: ResetPasswordDto) {
    // Verify the security token
    const decodedToken = this.jwtService.verifySecurityToken(dto.token);

    // Check if token type is password_reset
    if (decodedToken.type !== 'password_reset') {
      throw new BadRequestException('Invalid token type for password reset');
    }

    // Find citizen by email from token
    const citizen = await this.citizensService.findByEmail(decodedToken.email);
    if (!citizen) {
      throw new BadRequestException('Citizen not found.');
    }

    // Verify code in Redis matches token
    await this.validateResetPasswordToken(decodedToken.email, decodedToken.code);

    // Update password
    await this.citizensService.updateMyAccount(citizen, {
      password: dto.newPassword,
    });

    // Clean up Redis reset data
    await this.clearResetPasswordToken(decodedToken.email);

    return { message: 'Your password has been successfully reset.' };
  }

  // PRIVATE METHODS - Email Verification
  private async ensureEmailNotVerified(email: string) {
    const citizen = await this.citizensService.findByEmail(email);
    if (citizen) {
      throw new BadRequestException('Email already registered. Please login');
    }
    return true;
  }

  private async sendEmailVerificationCode(email: string) {
    const code = await this.generateEmailVerificationCode(email);
    await this.clearVerifiedEmailToken(email);
    // Email will be sent using EmailService from mail module
    // For now, log the code (in development)
    console.log(`Verification code for ${email}: ${code}`);
  }

  private async verifyEmailVerificationCode(email: string, code: string): Promise<void> {
    const key = this.getVerificationCodeKey(email);
    const cachedCode = await this.redisService.getString(key);
    if (cachedCode !== code) {
      throw new BadRequestException('Invalid verification code');
    }
    await this.redisService.delete(key);
  }

  private async cacheVerifiedEmailToken(email: string, code: string): Promise<void> {
    const key = this.getVerifiedEmailTokenKey(email);
    await this.redisService.setString(key, code, 60 * 5); // 5 minutes
  }

  private async validateVerifiedEmailToken(email: string, code: string): Promise<void> {
    const key = this.getVerifiedEmailTokenKey(email);
    const cachedCode = await this.redisService.getString(key);
    if (!cachedCode || cachedCode !== code) {
      throw new BadRequestException('Invalid or expired verification code');
    }
  }

  private async clearVerifiedEmailToken(email: string): Promise<void> {
    const key = this.getVerifiedEmailTokenKey(email);
    await this.redisService.delete(key);
  }

  // PRIVATE METHODS - Password Reset
  private async sendPasswordResetCode(email: string) {
    const code = await this.generatePasswordResetCode(email);
    await this.clearResetPasswordToken(email);
    // Email will be sent using EmailService from mail module
    // For now, log the code (in development)
    console.log(`Password reset code for ${email}: ${code}`);
  }

  private async verifyPasswordResetCode(email: string, code: string): Promise<void> {
    const key = this.getResetCodeKey(email);
    const cachedCode = await this.redisService.getString(key);
    if (cachedCode !== code) {
      throw new BadRequestException('Invalid reset code');
    }
    await this.redisService.delete(key);
  }

  private async cacheValidatedResetToken(email: string, code: string): Promise<void> {
    const key = this.getResetTokenKey(email);
    await this.redisService.setString(key, code, 60 * 5); // 5 minutes
  }

  private async validateResetPasswordToken(email: string, code: string): Promise<void> {
    const key = this.getResetTokenKey(email);
    const cachedCode = await this.redisService.getString(key);
    if (!cachedCode || cachedCode !== code) {
      throw new BadRequestException('Invalid or expired reset password code');
    }
  }

  private async clearResetPasswordToken(email: string): Promise<void> {
    const key = this.getResetTokenKey(email);
    await this.redisService.delete(key);
  }

  // PRIVATE METHODS - Code Generation
  private async generateEmailVerificationCode(email: string): Promise<string> {
    const code = this.generateRandomCode();
    const key = this.getVerificationCodeKey(email);
    await this.redisService.setString(key, code, 60 * 5); // 5 minutes
    return code;
  }

  private async generatePasswordResetCode(email: string): Promise<string> {
    const code = this.generateRandomCode();
    const key = this.getResetCodeKey(email);
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
  private getVerificationCodeKey(email: string): string {
    return `${Role.CITIZEN}:verification:email:${email}`;
  }

  private getVerifiedEmailTokenKey(email: string): string {
    return `${Role.CITIZEN}:verified:email:${email}`;
  }

  private getResetCodeKey(email: string): string {
    return `${Role.CITIZEN}:restoration:email:${email}`;
  }

  private getResetTokenKey(email: string): string {
    return `${Role.CITIZEN}:restored:email:${email}`;
  }
}
