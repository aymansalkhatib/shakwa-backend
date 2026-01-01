import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationModule } from '../../shared/services/notifications/notification.module';
import { RedisModule } from '../../shared/services/redis/redis.module';
import { StorageModule } from '../../shared/services/storage';
import { CitizensModule } from '../citizens/citizens.module';
import {
  COMPLAINTS_REPOSITORY_TOKEN,
  COMPLAINT_HISTORY_REPOSITORY_TOKEN,
} from './constants/your-bucket-name.tokens';
import { AdminComplaintsController } from './controllers/admin-your-bucket-name.controller';
import { CitizenComplaintsController } from './controllers/citizen-your-bucket-name.controller';
import { StaffComplaintsController } from './controllers/staff-your-bucket-name.controller';
import { ComplaintHistoryEntity } from './entities/complaint-history.entity';
import { ComplaintEntity } from './entities/complaint.entity';
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { ComplaintHistoryRepository } from './repositories/complaint-history.repository';
import { ComplaintsRepository } from './repositories/your-bucket-name.repository';
import { AdminComplaintsService } from './services/admin-your-bucket-name.service';
import { CacheInvalidationService } from './services/cache-invalidation.service';
import { CitizenComplaintsService } from './services/citizen-your-bucket-name.service';
import { ReportBuilderService } from './services/report-builder.service';
import { StaffComplaintsService } from './services/staff-your-bucket-name.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplaintEntity, ComplaintHistoryEntity]),
    StorageModule,
    RedisModule,
    NotificationModule,
    CitizensModule,
  ],
  controllers: [CitizenComplaintsController, StaffComplaintsController, AdminComplaintsController],
  providers: [
    CitizenComplaintsService,
    StaffComplaintsService,
    AdminComplaintsService,
    ReportBuilderService,
    {
      provide: COMPLAINTS_REPOSITORY_TOKEN,
      useClass: ComplaintsRepository,
    },
    {
      provide: COMPLAINT_HISTORY_REPOSITORY_TOKEN,
      useClass: ComplaintHistoryRepository,
    },
    CacheInvalidationService,
    CacheInterceptor,
  ],
  exports: [
    CitizenComplaintsService,
    StaffComplaintsService,
    AdminComplaintsService,
    COMPLAINTS_REPOSITORY_TOKEN,
    COMPLAINT_HISTORY_REPOSITORY_TOKEN,
  ],
})
export class ComplaintsModule {}
