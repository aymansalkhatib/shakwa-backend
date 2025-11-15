import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CITIZENS_REPOSITORY_TOKEN } from './constants/citizens.tokens';
import { CitizensController } from './controllers/citizens.controller';
import { CitizenEntity } from './entities/citizen.entity';
import { CitizensRepository } from './repositories/citizens.repository';
import { CitizensService } from './services/citizens.service';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenEntity])],
  controllers: [CitizensController],
  providers: [
    CitizensService,

    {
      provide: CITIZENS_REPOSITORY_TOKEN,
      useClass: CitizensRepository,
    },
  ],
  exports: [CitizensService, CITIZENS_REPOSITORY_TOKEN],
})
export class CitizensModule {}
