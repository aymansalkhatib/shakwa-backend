import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
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
  async sendVerificationEmail(@Body() dto: SendVerificationEmailDto) {
    return await this.citizensAuthService.sendVerificationEmail(dto);
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyEmailCodeDto) {
    return await this.citizensAuthService.verifyEmailCode(dto);
  }

  @Post('register')
  async register(@Body() dto: CitizenRegisterDto) {
    return await this.citizensAuthService.register(dto);
  }

  @Post('login')
  async login(@Body() dto: CitizenLoginDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip;
    return await this.citizensAuthService.login(dto, ip);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return await this.citizensAuthService.handleForgotPasswordRequest(dto);
  }

  @Post('verify-reset-code')
  async verifyResetPassword(@Body() dto: VerifyResetPasswordDto) {
    return this.citizensAuthService.verifyResetPassword(dto);
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return await this.citizensAuthService.resetPassword(dto);
  }
}
