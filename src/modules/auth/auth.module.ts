import { Module } from '@nestjs/common';
import { AppJwtService } from '../../shared/modules/app-jwt/app-jwt.service';
import { MailModule } from '../../shared/services/mail';
import { RedisModule } from '../../shared/services/redis';
import { CitizensModule } from '../citizens/citizens.module';
import { InternalUsersModule } from '../internal-users/internal-users.module';
import { CitizensAuthController } from './controllers/citizens-auth.controller';
import { InternalUsersAuthController } from './controllers/internal-users-auth.controller';
import { AuthCodeService } from './services/auth-code.service';
import { CitizensAuthService } from './services/citizens-auth.service';
import { InternalUsersAuthService } from './services/internal-users-auth.service';
import { LoginAttemptService } from './services/login-attempt.service';
import { CustomRateLimitModule } from '../../shared/modules/custom-rate-limit/custom-rate-limit.module';

@Module({
  imports: [CitizensModule, InternalUsersModule, RedisModule, CustomRateLimitModule, MailModule],
  controllers: [CitizensAuthController, InternalUsersAuthController],
  providers: [
    CitizensAuthService,
    InternalUsersAuthService,
    AppJwtService,
    AuthCodeService,
    LoginAttemptService,
  ],
  exports: [CitizensAuthService, InternalUsersAuthService],
})
export class AuthModule {}
