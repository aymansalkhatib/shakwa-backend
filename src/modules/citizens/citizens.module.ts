import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CitizensController } from './controllers/citizens.controller';
import { CitizensService } from './services/citizens.service';
import { CitizenEntity } from './entities/citizen.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CitizenEntity])],
  controllers: [CitizensController],
  providers: [CitizensService],
  exports: [CitizensService],
})
export class CitizensModule {}