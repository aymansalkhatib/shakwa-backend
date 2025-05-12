import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/base/user.entity';
import { JwtStrategy } from 'src/shared/modules/app-jwt/strategies/jwt.strategy';
import { AppJwtModule } from 'src/shared/modules/app-jwt/app-jwt.module';
import { Session } from './session.entity';
import { EndUser } from '../users/entities/role-specific/end-user.entity';
import { MailModule } from 'src/services/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session, EndUser]),
    PassportModule,
    AppJwtModule,
    MailModule,
  ],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
