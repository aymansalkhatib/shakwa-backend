import { Module } from '@nestjs/common';
import { AppJwtService } from '../../shared/modules/app-jwt/app-jwt.service';
import { CitizensModule } from '../citizens/citizens.module';
import { InternalUsersModule } from '../internal-users/internal-users.module';
import { CitizensAuthController } from './controllers/citizens-auth.controller';
import { InternalUsersAuthController } from './controllers/internal-users-auth.controller';
import { CitizensAuthService } from './services/citizens-auth.service';
import { InternalUsersAuthService } from './services/internal-users-auth.service';

@Module({
  imports: [CitizensModule, InternalUsersModule],
  controllers: [CitizensAuthController, InternalUsersAuthController],
  providers: [CitizensAuthService, InternalUsersAuthService, AppJwtService],
  exports: [CitizensAuthService, InternalUsersAuthService],
})
export class AuthModule {}
