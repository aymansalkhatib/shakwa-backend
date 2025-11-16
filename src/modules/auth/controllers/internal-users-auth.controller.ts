import { Body, Controller, Post } from '@nestjs/common';
import { InternalUserForgotPasswordDto } from '../dtos/request/internal-users/forgot-password.dto';
import { InternalUserLoginDto } from '../dtos/request/internal-users/internal-user-login.dto';
import { InternalUserResetPasswordDto } from '../dtos/request/internal-users/reset-password.dto';
import { InternalUserVerifyResetPasswordDto } from '../dtos/request/internal-users/verify-reset-password.dto';
import { InternalUsersAuthService } from '../services/internal-users-auth.service';

@Controller('auth/internal-users')
export class InternalUsersAuthController {
  constructor(private readonly internalUsersAuthService: InternalUsersAuthService) {}

  @Post('login')
  async login(@Body() loginDto: InternalUserLoginDto) {
    return await this.internalUsersAuthService.login(loginDto);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: InternalUserForgotPasswordDto) {
    return await this.internalUsersAuthService.handleForgotPasswordRequest(dto);
  }

  @Post('verify-reset-code')
  async verifyResetPassword(@Body() dto: InternalUserVerifyResetPasswordDto) {
    return this.internalUsersAuthService.verifyResetPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: InternalUserResetPasswordDto) {
    return await this.internalUsersAuthService.resetPassword(dto);
  }
}
