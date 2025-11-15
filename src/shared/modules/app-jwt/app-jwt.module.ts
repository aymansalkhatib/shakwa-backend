import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../app-config/env.schema';
import { AppJwtService } from './app-jwt.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Global()
@Module({
  imports: [
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
  exports: [AppJwtService, JwtAuthGuard],
  providers: [AppJwtService, JwtAuthGuard],
})
export class AppJwtModule {}
