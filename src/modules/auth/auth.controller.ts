import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Param,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/modules/app-jwt/guards/jwt-auth.guard';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { RegisterDto, LoginDto, TokenPairDto, VerifyEmailDto, ForgotPasswordDto, ResetPasswordDto } from './dto/request';
import { RegisterResponseDto, LoginResponseDto, UserResponseDto } from './dto/response';



@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<RegisterResponseDto> {
    await this.authService.register(registerDto);
    return {
      message: 'A verification email has been sent to your email address.',
    };
  }


  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Headers('user-agent') userAgent: string,
  ): Promise<LoginResponseDto> {
    const loginResult = await this.authService.login(loginDto, ip, userAgent);
    return new LoginResponseDto(loginResult);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() tokens: TokenPairDto) {
    const response = await this.authService.logout(tokens);
    return response;
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() tokens: TokenPairDto) {
    return this.authService.refreshTokens(tokens);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getProfile(@CurrentUser() user): UserResponseDto {
    return new UserResponseDto(user);
  }

  // Add this method to your AuthController class
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    return this.authService.verifyEmail(verifyEmailDto);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendVerificationCode(@Body('email') email: string): Promise<{ message: string }> {
    await this.authService.resendVerificationCode(email);
    return {
      message: 'A new verification code has been sent to your email address.',
    };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto.email);
    return {
      message: 'If an account with that email exists, we have sent a password reset code',
    };
  }

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
