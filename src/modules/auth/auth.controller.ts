import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/modules/app-jwt/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { 
  RegisterDto, 
  LoginDto, 
  TokenPairDto, 
  VerifyEmailDto, 
  ForgotPasswordDto, 
  ResetPasswordDto 
} from './dto/request';
import { 
  RegisterResponseDto, 
  LoginResponseDto, 
  UserResponseDto 
} from './dto/response';

/**
 * Authentication Controller
 * Handles all authentication-related endpoints
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Register a new user
   * @param registerDto User registration data
   * @returns Registration confirmation message
   */
  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    await this.authService.register(registerDto);
    return {
      message: 'A verification email has been sent to your email address.',
    };
  }

  /**
   * Authenticate a user
   * @param loginDto User login credentials
   * @param ip Client IP address
   * @param userAgent Client user agent
   * @returns Login response with tokens and user data
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponseDto> {
    return await this.authService.login(loginDto, ip, userAgent);
  }

  /**
   * Log out a user by revoking their session
   * @param tokens Access and refresh tokens
   * @returns Void
   */
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() tokens: TokenPairDto): Promise<{ message: string }> {
    await this.authService.logout(tokens);
    return {
      message: 'Logged out successfully'
    };
  }
  /**
   * Refresh access token using refresh token
   * @param tokens Current token pair
   * @returns New access token
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body() tokens: TokenPairDto): Promise<{ accessToken: string }> {
    const accessToken = await this.authService.refreshTokens(tokens);
    return { accessToken };
  }

  /**
   * Get current user profile
   * @param user Current authenticated user
   * @returns User profile data
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user): UserResponseDto {
    return new UserResponseDto(user);
  }

  /**
   * Verify user email with verification code
   * @param verifyEmailDto Email and verification code
   * @returns Void
   */
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<{ message: string }> {
    await this.authService.verifyEmail(verifyEmailDto);
    return {
      message: 'Email verified successfully. You can now log in.',
    };
  }

  /**
   * Resend verification code to user email
   * @param email User email address
   * @returns Confirmation message
   */
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.resendVerificationCode(email);
    return {
      message: 'A new verification code has been sent to your email address.',
    };
  }

  /**
   * Initiate password reset process
   * @param forgotPasswordDto User email
   * @returns Confirmation message
   */
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'If an account with that email exists, we have sent a password reset code',
    };
  }

  /**
   * Reset user password with verification code
   * @param resetPasswordDto Email, code and new password
   * @returns Confirmation message
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(
      resetPasswordDto.email,
      resetPasswordDto.code,
      resetPasswordDto.password
    );
    return {
      message: 'Password has been reset successfully',
    };
  }
}
