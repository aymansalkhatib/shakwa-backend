import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import {
  CustomRateLimit,
  RateLimitKey,
} from '../../../common/decorators/custom-rate-limit.decorator';
import { CustomRateLimitGuard } from '../../../common/guards/custom-rate-limit.guard';
import { CitizenLoginDto } from '../dtos/request/citizens/citizen-login.dto';
import { CitizenRegisterDto } from '../dtos/request/citizens/citizen-register.dto';
import { ForgotPasswordDto } from '../dtos/request/citizens/forgot-password.dto';
import { ResetPasswordDto } from '../dtos/request/citizens/reset-password.dto';
import { SendVerificationEmailDto } from '../dtos/request/citizens/send-verification-email.dto';
import { VerifyEmailCodeDto } from '../dtos/request/citizens/verify-email-code.dto';
import { VerifyResetPasswordDto } from '../dtos/request/citizens/verify-reset-password.dto';
import { CitizensAuthService } from '../services/citizens-auth.service';

@Controller('auth/citizens')
export class CitizensAuthController {
  constructor(private readonly citizensAuthService: CitizensAuthService) {}

  @Post('send-verification-email')
  @UseGuards(CustomRateLimitGuard)
  @CustomRateLimit({ key: RateLimitKey.EMAIL_VERIFICATION })
  async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
    await this.citizensAuthService.sendVerificationEmail(dto);
    return {
      message: 'Verification email has been sent successfully.',
    };
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyEmailCodeDto) {
    const result = await this.citizensAuthService.verifyEmailCode(dto);
    return {
      message:
        'Email successfully verified. You have 5 minutes to register before you need to reverify.',
      ...result,
    };
  }

  @Post('register')
  async register(@Body() dto: CitizenRegisterDto) {
    await this.citizensAuthService.register(dto);
    return {
      message: 'Citizen registered successfully. You can now login to your account.',
    };
  }

  @Post('login')
  async login(@Body() dto: CitizenLoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return await this.citizensAuthService.login(dto, ip);
  }

  @Post('forgot-password')
  @UseGuards(CustomRateLimitGuard)
  @CustomRateLimit({ key: RateLimitKey.PASSWORD_RESET })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.citizensAuthService.handleForgotPasswordRequest(dto);
    return {
      message: 'Password reset code has been sent to your email. Please check your inbox.',
    };
  }

  @Post('verify-reset-code')
  async verifyResetPassword(@Body() dto: VerifyResetPasswordDto) {
    const result = await this.citizensAuthService.verifyResetPassword(dto);
    return {
      message: 'Reset code verified successfully. You can now reset your password.',
      ...result,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    await this.citizensAuthService.resetPassword(dto);
    return { message: 'Your password has been successfully reset.' };
  }
}
