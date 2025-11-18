import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AppJwtService } from './app-jwt.service';

@Global()
@Module({
  exports: [AppJwtService, JwtAuthGuard],
  providers: [AppJwtService, JwtAuthGuard],
})
export class AppJwtModule {}
