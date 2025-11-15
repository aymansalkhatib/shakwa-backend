import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensController } from './controllers/citizens.controller';
import { CitizenEntity } from './entities/citizen.entity';
import { CitizensRepository } from './repositories/citizens.repository';
import { CitizensService } from './services/citizens.service';
import { CITIZENS_REPOSITORY_TOKEN } from './citizens.tokens';

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
