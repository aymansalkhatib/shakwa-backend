import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CITIZENS_REPOSITORY_TOKEN } from './constants/citizens.tokens';
import { CitizensAdminController } from './controllers/citizens-admin.controller';
import { CitizensController } from './controllers/citizens.controller';
import { CitizenEntity } from './entities/citizen.entity';
import { CitizensRepository } from './repositories/citizens.repository';
import { CitizensAdminService } from './services/citizens-admin.service';
import { CitizensService } from './services/citizens.service';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenEntity])],
  controllers: [CitizensController, CitizensAdminController],
  providers: [
    CitizensService,
    CitizensAdminService,
    {
      provide: CITIZENS_REPOSITORY_TOKEN,
      useClass: CitizensRepository,
    },
  ],
  exports: [CitizensService, CitizensAdminService, CITIZENS_REPOSITORY_TOKEN],
})
export class CitizensModule {}
