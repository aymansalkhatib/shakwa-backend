import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from './constants/your-bucket-name.tokens';
import { AdminComplaintsController } from './controllers/admin-your-bucket-name.controller';
import { CitizenComplaintsController } from './controllers/citizen-your-bucket-name.controller';
import { StaffComplaintsController } from './controllers/staff-your-bucket-name.controller';
import { ComplaintHistoryEntity } from './entities/complaint-history.entity';
import { ComplaintEntity } from './entities/complaint.entity';
import { ComplaintHistoryRepository } from './repositories/complaint-history.repository';
import { ComplaintsRepository } from './repositories/your-bucket-name.repository';
import { AdminComplaintsService } from './services/admin-your-bucket-name.service';
import { CitizensComplaintsService } from './services/citizens-your-bucket-name.service';
import { StaffComplaintsService } from './services/staff-your-bucket-name.service';

@Module({
  imports: [TypeOrmModule.forFeature([ComplaintEntity, ComplaintHistoryEntity])],
  controllers: [CitizenComplaintsController, StaffComplaintsController, AdminComplaintsController],
  providers: [
    AdminComplaintsService,
    StaffComplaintsService,
    CitizensComplaintsService,
    {
      provide: COMPLAINTS_REPOSITORY_TOKEN,
      useClass: ComplaintsRepository,
    },
    {
      provide: COMPLAINT_HISTORY_REPOSITORY_TOKEN,
      useClass: ComplaintHistoryRepository,
    },
  ],
  exports: [
    AdminComplaintsService,
    StaffComplaintsService,
    CitizensComplaintsService,
    COMPLAINTS_REPOSITORY_TOKEN,
    COMPLAINT_HISTORY_REPOSITORY_TOKEN,
  ],
})
export class ComplaintsModule {}
