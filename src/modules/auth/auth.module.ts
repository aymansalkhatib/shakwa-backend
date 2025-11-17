import { Module } from '@nestjs/common';
import { AppJwtService } from '../../shared/modules/app-jwt/app-jwt.service';
import { CitizensModule } from '../citizens/citizens.module';
import { InternalUsersModule } from '../internal-users/internal-users.module';
import { CitizensAuthController } from './controllers/citizens-auth.controller';
import { InternalUsersAuthController } from './controllers/internal-users-auth.controller';
import { AuthCodeService } from './services/auth-code.service';
import { CitizensAuthService } from './services/citizens-auth.service';
import { InternalUsersAuthService } from './services/internal-users-auth.service';
import { RedisModule } from '../../shared/services/redis';

@Module({
  imports: [CitizensModule, InternalUsersModule,RedisModule],
  controllers: [CitizensAuthController, InternalUsersAuthController],
  providers: [CitizensAuthService, InternalUsersAuthService, AppJwtService, AuthCodeService],
  exports: [CitizensAuthService, InternalUsersAuthService],
})
export class AuthModule {}
