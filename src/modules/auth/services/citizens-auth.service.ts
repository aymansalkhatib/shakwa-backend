import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { plainToInstance } from 'class-transformer';
import { Role } from '../../../common/enums/role.enum';
import { CitizenComplaintsService } from '../../../modules/your-bucket-name/services/citizen-your-bucket-name.service';
import { EnvironmentConfig } from '../../../shared/modules/app-config';
import { AppJwtService } from '../../../shared/modules/app-jwt/app-jwt.service';
import { CitizenResponseDto } from '../../citizens/dtos';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { CitizensService } from '../../citizens/services/citizens.service';
import { CitizenLoginDto } from '../dtos/request/citizens/citizen-login.dto';
import { CitizenRegisterDto } from '../dtos/request/citizens/citizen-register.dto';
import { ForgotPasswordDto } from '../dtos/request/citizens/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/request/citizens/reset-password.dto';
import { SendVerificationEmailDto } from '../dtos/request/citizens/send-verification-email.dto';
import { VerifyEmailCodeDto } from '../dtos/request/citizens/verify-email-code.dto';
import { VerifyResetPasswordDto } from '../dtos/request/citizens/verify-reset-password.dto';
import { AuthCodePurpose } from '../enums/auth-code-purpose.enum';
import { IAuthCodeKeyContext } from '../interfaces/auth-code-key-context.interface';
import { ILoginAttemptOptions } from '../interfaces/login-attempt-options.interface';
import { AuthCodeService } from './auth-code.service';
import { LoginAttemptService } from './login-attempt.service';

@Injectable()
export class CitizensAuthService {
  private readonly securityTokenTtlSeconds: number;

  constructor(
    private readonly citizensService: CitizensService,
    private readonly jwtService: AppJwtService,
    private readonly authCodeService: AuthCodeService,
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly loginAttemptService: LoginAttemptService,
    private readonly citizenComplaintsService: CitizenComplaintsService,
  ) {
    this.securityTokenTtlSeconds = this.configService.getOrThrow<number>(
      'JWT_SECURITY_EXPIRES_IN_S',
    );
  }

  async sendVerificationEmail(dto: SendVerificationEmailDto) {
    await this.ensureEmailNotVerified(dto.email);
    await this.sendEmailVerificationCode(dto.email);
  }

  async verifyEmailCode(dto: VerifyEmailCodeDto) {
    await this.ensureEmailNotVerified(dto.email);

    await this.authCodeService.verifyCode({
      ...this.genKey(dto.email, AuthCodePurpose.EMAIL_VERIFICATION_CODE),
      code: dto.code,
      errorMessage: 'Invalid verification code',
    });

    await this.authCodeService.cacheCode({
      ...this.genKey(dto.email, AuthCodePurpose.EMAIL_VERIFICATION_TOKEN),
      code: dto.code,
      ttlSeconds: this.securityTokenTtlSeconds,
    });

    const token = this.jwtService.createSecurityToken({
      code: dto.code,
      email: dto.email,
      type: 'email_verification',
    });

    return { token };
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
      throw new BadRequestException('Email verification failed');
    }

    // 4. Verify code in Redis
    await this.authCodeService.verifyCode({
      ...this.genKey(registerDto.email, AuthCodePurpose.EMAIL_VERIFICATION_TOKEN),
      code: decodedToken.code,
      errorMessage: 'Invalid or expired verification code',
      consume: false,
    });

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
    await this.citizensService.create(registerDto);

    // 7. Clean up Redis verification data
    await this.authCodeService.clearCode(
      this.genKey(registerDto.email, AuthCodePurpose.EMAIL_VERIFICATION_TOKEN),
    );
  }

  async login(loginDto: CitizenLoginDto, ip: string) {
    const { email, password, fcmToken } = loginDto;

    const citizen = await this.citizensService.findByEmail(email);

    // Set up login attempt options for this citizen by email
    const loginAttemptOptions: ILoginAttemptOptions = {
      key: `citizen:login:${email.toLowerCase()}`,
      maxAttempts: 5,
      blockSeconds: 2 * 60 * 60, // 2h
      windowSeconds: 3 * 60 * 60, // 3h
      ipAddress: ip,
      email: email,
    };

    await this.loginAttemptService.checkBlocked(loginAttemptOptions);

    if (!citizen) {
      await this.loginAttemptService.registerFailure(loginAttemptOptions);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(password, citizen.password);
    if (!isPasswordValid) {
      await this.loginAttemptService.registerFailure(loginAttemptOptions);
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if citizen is blocked
    if (citizen.blockedAt) {
      throw new UnauthorizedException('Your account has been blocked. Please contact support.');
    }

    // Update last login
    await this.citizensService.updateLastLoginAt(citizen, fcmToken, ip);

    const token = this.jwtService.createAccessToken({
      userId: citizen.id,
      role: Role.CITIZEN,
    });

    await this.loginAttemptService.resetFailures(loginAttemptOptions.key);

    return {
      token,
      user: plainToInstance(CitizenResponseDto, citizen),
    };
  }

  async logout(citizen: CitizenEntity) {
    // Release all complaint locks held by this citizen via service layer
    await this.citizenComplaintsService.releaseAllLocksForUser(citizen.id);

    // Update last logout timestamp
    await this.citizensService.updateLastLogoutAt(citizen);
  }

  async handleForgotPasswordRequest(dto: ForgotPasswordDto) {
    const citizen = await this.citizensService.findByEmail(dto.email);
    if (!citizen) {
      throw new BadRequestException('Email not found. Please create an account first.');
    }
    await this.sendPasswordResetCode(citizen.email);
  }

  async verifyResetPassword(dto: VerifyResetPasswordDto) {
    const citizen = await this.citizensService.findByEmail(dto.email);
    if (!citizen) {
      throw new BadRequestException('Email not found. Please create an account first.');
    }

    await this.authCodeService.verifyCode({
      ...this.genKey(dto.email, AuthCodePurpose.PASSWORD_RESET_CODE),
      code: dto.code,
      errorMessage: 'Invalid reset code',
    });

    await this.authCodeService.cacheCode({
      ...this.genKey(dto.email, AuthCodePurpose.PASSWORD_RESET_TOKEN),
      code: dto.code,
      ttlSeconds: this.securityTokenTtlSeconds,
    });

    // Create security token for password reset
    const token = this.jwtService.createSecurityToken({
      email: dto.email,
      code: dto.code,
      type: 'password_reset',
    });

    return { token };
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
    await this.authCodeService.verifyCode({
      ...this.genKey(decodedToken.email, AuthCodePurpose.PASSWORD_RESET_TOKEN),
      code: decodedToken.code,
      errorMessage: 'Invalid or expired reset password code',
      consume: false,
    });

    // Update password
    await this.citizensService.updatePassword(citizen, dto.newPassword);

    // Clean up Redis reset data
    await this.authCodeService.clearCode(
      this.genKey(decodedToken.email, AuthCodePurpose.PASSWORD_RESET_TOKEN),
    );
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
    await this.authCodeService.clearCode(
      this.genKey(email, AuthCodePurpose.EMAIL_VERIFICATION_TOKEN),
    );

    const code = await this.authCodeService.generateCode({
      ...this.genKey(email, AuthCodePurpose.EMAIL_VERIFICATION_CODE),
      ttlSeconds: this.securityTokenTtlSeconds,
    });

    await this.authCodeService.sendCodeViaEmail({
      to: email,
      code,
      subject: 'Citizens Email Verification',
    });
  }

  // PRIVATE METHODS - Password Reset
  private async sendPasswordResetCode(email: string) {
    await this.authCodeService.clearCode(this.genKey(email, AuthCodePurpose.PASSWORD_RESET_TOKEN));

    const code = await this.authCodeService.generateCode({
      ...this.genKey(email, AuthCodePurpose.PASSWORD_RESET_CODE),
      ttlSeconds: this.securityTokenTtlSeconds,
    });

    await this.authCodeService.sendCodeViaEmail({
      to: email,
      code,
      subject: 'Citizens Password Reset',
    });
  }

  private genKey(email: string, purpose: AuthCodePurpose): IAuthCodeKeyContext {
    return { role: Role.CITIZEN, email, purpose };
  }
}
