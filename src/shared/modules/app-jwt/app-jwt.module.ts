import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from 'src/shared/modules/app-config/env.schema';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AppJwtService } from './app-jwt.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/modules/users/entities/base/user.entity';
import { Session } from 'src/modules/auth/session.entity';

/**
 * Module for JWT authentication and authorization
 * Provides services for token creation, validation, and user authentication
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([User, Session]),
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService<EnvironmentConfig>) => ({
        secret: configService.get('JWT_ACCESS_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRES_IN_MS'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  exports: [AppJwtService, JwtStrategy],
  providers: [AppJwtService, JwtStrategy],
})
export class AppJwtModule {}
