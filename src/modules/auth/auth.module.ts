import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { User } from '../users/entities/user.entity';
import { JwtStrategy } from 'src/shared/modules/app-jwt/strategies/jwt.strategy';
import { AppJwtModule } from 'src/shared/modules/app-jwt/app-jwt.module';
import { Session } from '../users/entities/session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Session]), PassportModule, AppJwtModule],

  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
