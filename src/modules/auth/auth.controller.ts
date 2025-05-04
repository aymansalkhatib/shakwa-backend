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
  UseInterceptors,
  ClassSerializerInterceptor,
  SerializeOptions,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../shared/modules/app-jwt/guards/jwt-auth.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Role, AdminSubRole } from 'src/common/enums/role.enum';
import { RolesGuard } from 'src/common/guards/roles.guard';
import {
  LoginResponseDto,
  RegisterResponseDto,
  TokenPairResponseDto,
  UserResponseDto,
} from './dto/auth.response.dto';
import { CurrentUser } from 'src/common/decorators/user.decorator';
import { TokenPairDto } from './dto/token-pair.dto';

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

  @Get('confirm/:token')
  async confirmEmail(@Param('token') token: string) {
    await this.authService.confirmEmail(token);
    return { message: 'Email confirmed successfully' };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto): Promise<LoginResponseDto> {
    const loginResult = await this.authService.login(loginDto);
    return new LoginResponseDto(loginResult);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@CurrentUser() user: UserResponseDto) {
    return await this.authService.logout(user);
    return { message: 'Logged out successfully' };
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPERADMIN)
  @Get('superadmin')
  superAdminRoute() {
    return { message: 'Super Admin access granted' };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminSubRole.MARKETING)
  @Get('admin/marketing')
  marketingAdminRoute() {
    return { message: 'Marketing Admin access granted' };
  }
}
