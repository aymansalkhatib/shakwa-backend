import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from '../users/entities/base/user.entity';
import { EnvironmentConfig } from 'src/shared/modules/app-config/env.schema';
import { Session } from './session.entity';
import { AppJwtService } from 'src/shared/modules/app-jwt/app-jwt.service';
import { UserRole } from 'src/common/enums/role.enum';
import { EndUser } from '../users/entities/role-specific/end-user.entity';
import { SuperAdmin } from '../users/entities/role-specific/super-admin.entity';
import { MailService } from 'src/services/mail/mail.service';

// Import request DTOs
import { 
  LoginDto,
  RegisterDto,
  TokenPairDto,
  VerifyEmailDto
} from './dto/request';

// Import response DTOs
import { 
  LoginResponseDto, 
  UserResponseDto 
} from './dto/response';
import { DecodedAccessTokenPayload, DecodedRefreshTokenPayload, TokenPair } from 'src/shared/modules/app-jwt/interfaces';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(EndUser)
    private enduserRepository: Repository<EndUser>,
    @InjectRepository(SuperAdmin)
    private superAdminRepository: Repository<SuperAdmin>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
    private appJwtService: AppJwtService,
    private configService: ConfigService<EnvironmentConfig>,
    private readonly dataSource: DataSource,
    private readonly mailService: MailService,
  ) {}

  /**
   * Registers a new user in the system
   * @param registerDto - Registration data transfer object
   * @throws ConflictException if user already exists
   * @throws InternalServerErrorException if registration fails
   */
  async register(registerDto: RegisterDto): Promise<void> {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const verificationCode = this.generateVerificationCode();
    const securityToken = this.appJwtService.createSecurityToken({
      email: registerDto.email,
      code: verificationCode,
      type: 'email_verification',
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(this.userRepository.target, {
        email: registerDto.email,
        password: registerDto.password,
        securityToken,
        roles: [UserRole.END_USER],
      });

      await queryRunner.manager.save(user);

      const endUser = queryRunner.manager.create(this.enduserRepository.target, {
        id: user.id,
        user: user,
      });
      await queryRunner.manager.save(endUser);

      this.mailService.sendMail({
        to: user.email,
        subject: 'Email Verification Code',
        template: 'verify-code',
        context: {
          username: user.email.split('@')[0],
          email: user.email,
          code: verificationCode.toString(),
        },
      });

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Authenticates a user and creates a new session
   * @param loginDto - Login credentials
   * @param ip - Client IP address
   * @param userAgent - Client user agent string
   * @throws UnauthorizedException for invalid credentials or account status issues
   * @throws ForbiddenException for too many failed attempts
   */
  async login(loginDto: LoginDto, ip: string, userAgent: string): Promise<LoginResponseDto> {
    const queryRunner: QueryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.findOne(User, {
        where: { email: loginDto.email },
      });

      if (!user || !(await user.validatePassword(loginDto.password))) {
        throw new UnauthorizedException('The provided email or password is invalid');
      }

      // Comprehensive account status validation
      await this.validateUserStatus(user);

      // Generate tokens with role-specific claims
      const tokens = await this.generateUserTokens(user);

      // Create and save new session
      await this.createUserSession(queryRunner, user, tokens.refreshToken, ip, userAgent);

      user.sessionNumber++;

      await queryRunner.manager.save(user);

      await queryRunner.commitTransaction();

      return {
        tokens,
        user: new UserResponseDto(user),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Logs out a user by revoking their current session
   * @param tokens - Current access and refresh tokens
   * @throws ForbiddenException for token mismatch
   * @throws NotFoundException if session not found
   */
  async logout(tokens: TokenPairDto): Promise<void> {
    const refreshTokenData: DecodedRefreshTokenPayload = this.appJwtService.verifyRefreshToken(
      tokens.refreshToken,
    );
    const accessTokenData = this.appJwtService.verifyAccessToken(tokens.accessToken);

    this.validateTokenMatch(refreshTokenData, accessTokenData);

    const session = await this.sessionRepository.findOne({
      where: {
        userId: refreshTokenData.userId,
        sessionNumber: refreshTokenData.sessionNumber,
      },
    });

    if (!session) {
      throw new NotFoundException('Active session not found');
    } else if (session.revokedAt) {
      throw new UnauthorizedException('Session has been revoked. Please log in again.');
    }

    session.revoke();
    await this.sessionRepository.save(session);
  }

  /**
   * Refreshes the access token using a valid refresh token
   * @param tokens - Current token pair
   * @throws UnauthorizedException for invalid or expired tokens
   */
  async refreshTokens(tokens: TokenPairDto): Promise<string> {
    const refreshTokenData = this.appJwtService.verifyRefreshToken(tokens.refreshToken);

    const session = await this.sessionRepository.findOne({
      where: {
        refreshToken: tokens.refreshToken,
        revokedAt: null,
      },
      relations: ['user'],
    });

    if (!session || session.isExpired()) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    await this.validateUserStatus(session.user);

    const accessToken = this.appJwtService.createAccessToken({
      userId: session.user.id,
      email: session.user.email,
      roles: session.user.roles,
      sessionNumber: refreshTokenData.sessionNumber,
    });

    session.updateLastActive();
    await this.sessionRepository.save(session);

    return accessToken;
  }

  /**
   * Validates user account status
   * @param user - User entity to validate
   * @throws UnauthorizedException for various account status issues
   */
  private async validateUserStatus(user: User): Promise<void> {
    if (!user.verifiedAt) {
      throw new UnauthorizedException('Email not verified');
    }

    if (user.blockedAt) {
      throw new UnauthorizedException('Account is blocked');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }
  }

  /**
   * Generates authentication tokens for a user
   * @param user - User entity
   * @returns TokenPair containing access and refresh tokens
   */
  private async generateUserTokens(user: User): Promise<TokenPair> {
    return this.appJwtService.createTokenPair({
      userId: user.id,
      email: user.email,
      roles: user.roles,
      sessionNumber: user.sessionNumber,
    });
  }

  /**
   * Creates a new user session
   * @param queryRunner - Database transaction runner
   * @param user - User entity
   * @param refreshToken - Refresh token
   * @param ip - Client IP
   * @param userAgent - Client user agent
   */
  private async createUserSession(
    queryRunner: QueryRunner,
    user: User,
    refreshToken: string,
    ip: string,
    userAgent: string,
  ): Promise<Session> {
    const sessionDuration: number = this.configService.get<number>('JWT_REFRESH_EXPIRES_IN_MS');
    const session = queryRunner.manager.create(Session, {
      user,
      refreshToken,
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + sessionDuration),
    });
    return queryRunner.manager.save(session);
  }

  /**
   * Generates a random 6-digit numeric verification code.
   * The generated code ranges between 100000 and 999999 (inclusive) to ensure
   * it is always a 6-digit number. This is typically used for email or phone verification flows.
   *
   * @returns A 6-digit verification code as a number
   */
  private generateVerificationCode(): number {
    return Math.floor(100000 + Math.random() * 900000);
  }

  /**
   * Validates whether the access token and refresh token belong to the same user and session.
   * Throws a ForbiddenException if there is a mismatch in either user ID or session number.
   *
   * This ensures tokens are not reused or tampered with across different users or sessions.
   *
   * @param refreshTokenData - The decoded payload of the refresh token
   * @param accessTokenData - The decoded payload of the access token
   * @throws {ForbiddenException} If the user IDs or session numbers do not match
   */
  private validateTokenMatch(
    refreshTokenData: DecodedRefreshTokenPayload,
    accessTokenData: DecodedAccessTokenPayload,
  ): void {
    const isUserIdMismatch = refreshTokenData.userId !== accessTokenData.userId;
    const isSessionMismatch = refreshTokenData.sessionNumber !== accessTokenData.sessionNumber;

    if (isUserIdMismatch || isSessionMismatch) {
      throw new ForbiddenException('Token mismatch detected');
    }
  }

  /**
   * Verifies a user's email using the verification code
   * @param verifyEmailDto - Email and verification code
   * @throws UnauthorizedException for invalid verification code
   * @throws NotFoundException if user not found
   */
  async verifyEmail(verifyEmailDto: VerifyEmailDto): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email: verifyEmailDto.email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verifiedAt) {
      throw new BadRequestException('Email has already been verified');
    }

    if (!user.securityToken) {
      throw new BadRequestException('Email already verified or security token expired');
    }
    const payload = this.appJwtService.verifySecurityToken(user.securityToken);

    if (payload.type !== 'email_verification' || payload.code !== verifyEmailDto.code) {
      throw new UnauthorizedException('Invalid verification code');
    }

    user.verifiedAt = new Date();
    user.securityToken = null;
    await this.userRepository.save(user);
  }

  /**
   * Resends verification code to a user's email
   * @param email - User's email address
   * @throws NotFoundException if user not found
   * @throws BadRequestException if email already verified
   */
  async resendVerificationCode(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.verifiedAt) {
      throw new BadRequestException('Email has already been verified');
    }

    // Generate new verification code
    const verificationCode = this.generateVerificationCode();

    // Create new security token
    const securityToken = this.appJwtService.createSecurityToken({
      email: user.email,
      code: verificationCode,
      type: 'email_verification',
    });

    // Update user with new security token
    user.securityToken = securityToken;
    await this.userRepository.save(user);

    // Send email with new verification code
    await this.mailService.sendMail({
      to: user.email,
      subject: 'New Email Verification Code',
      template: 'verify-code',
      context: {
        username: user.email.split('@')[0],
        email: user.email,
        code: verificationCode.toString(),
      },
    });
  }

  /**
   * Initiates the password reset process by sending a reset code to the user's email
   * @param email - User's email address
   * @throws NotFoundException if user not found
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate reset code
    const resetCode = this.generateVerificationCode();

    // Create security token for password reset
    const securityToken = this.appJwtService.createSecurityToken({
      email: user.email,
      code: resetCode,
      type: 'password_reset',
    });

    // Update user with security token
    user.securityToken = securityToken;
    await this.userRepository.save(user);

    // Send email with reset code
    await this.mailService.sendMail({
      to: user.email,
      subject: 'Password Reset Code',
      template: 'reset-password',
      context: {
        username: user.email.split('@')[0],
        email: user.email,
        code: resetCode.toString(),
        expiryTime: '1 hour',
      },
    });
  }

  /**
   * Resets the user's password using a valid reset code
   * @param email - User's email
   * @param code - Reset code
   * @param newPassword - New password
   * @throws BadRequestException for invalid code
   * @throws NotFoundException if user not found
   */
  async resetPassword(email: string, code: number, newPassword: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.securityToken) {
      throw new BadRequestException('No password reset was requested or the token has expired');
    }

    try {
      const payload = this.appJwtService.verifySecurityToken(user.securityToken);

      if (payload.type !== 'password_reset' || payload.code !== code) {
        throw new BadRequestException('Invalid reset code');
      }

      // Update the password
      user.password = newPassword;
      user.passwordChangedAt = new Date();
      user.securityToken = null;

      // Revoke all active sessions for security
      await this.sessionRepository.update(
        { userId: user.id, revokedAt: null },
        { revokedAt: new Date() },
      );

      // Save the user with the new password
      await this.userRepository.save(user);

      // Send confirmation email
      await this.mailService.sendMail({
        to: user.email,
        subject: 'Password Changed Successfully',
        template: 'password-changed',
        context: {
          username: user.email.split('@')[0],
        },
      });
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Invalid or expired reset token');
    }
  }
}
