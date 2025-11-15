import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { EnvironmentConfig } from '../app-config/env.schema';
import { AppJwtService } from './app-jwt.service';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: async (configService: ConfigService<EnvironmentConfig>) => {
        const expiresInMs = configService.getOrThrow<number>('JWT_ACCESS_EXPIRES_IN_MS');
        return {
          secret: configService.getOrThrow('JWT_ACCESS_SECRET'),
          signOptions: {
            expiresIn: Math.floor(expiresInMs / 1000), // Convert ms to seconds
          },
        };
      },
      inject: [ConfigService],
    }),
  ],
  exports: [AppJwtService, JwtAuthGuard],
  providers: [AppJwtService, JwtAuthGuard],
})
export class AppJwtModule {}
