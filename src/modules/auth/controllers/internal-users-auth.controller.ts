import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { PasswordResetRateLimit } from '../../../common/decorators/custom-rate-limit.decorator';
import { InternalUserForgotPasswordDto } from '../dtos/request/internal-users/forgot-password.dto';
import { InternalUserLoginDto } from '../dtos/request/internal-users/internal-user-login.dto';
import { InternalUserResetPasswordDto } from '../dtos/request/internal-users/reset-password.dto';
import { InternalUserVerifyResetPasswordDto } from '../dtos/request/internal-users/verify-reset-password.dto';
import { InternalUsersAuthService } from '../services/internal-users-auth.service';

@Controller('auth/internal-users')
export class InternalUsersAuthController {
  constructor(private readonly internalUsersAuthService: InternalUsersAuthService) {}

  @Post('login')
  async login(@Body() loginDto: InternalUserLoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return await this.internalUsersAuthService.login(loginDto, ip);
  }

  @Post('forgot-password')
  @PasswordResetRateLimit()
  async forgotPassword(@Body() dto: InternalUserForgotPasswordDto) {
    await this.internalUsersAuthService.handleForgotPasswordRequest(dto);
    return {
      message: 'Password reset code has been sent to your email. Please check your inbox.',
    };
  }

  @Post('verify-reset-code')
  async verifyResetPassword(@Body() dto: InternalUserVerifyResetPasswordDto) {
    const result = await this.internalUsersAuthService.verifyResetPassword(dto);
    return {
      message: 'Reset code verified successfully. You can now reset your password.',
      ...result,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: InternalUserResetPasswordDto) {
    await this.internalUsersAuthService.resetPassword(dto);
    return { message: 'Your password has been successfully reset.' };
  }
}
