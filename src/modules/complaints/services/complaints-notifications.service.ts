// File: src/modules/your-bucket-name/services/your-bucket-name-notifications.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { CitizenEntity } from '../../citizens/entities/citizen.entity';
import { ComplaintHistoryEntity } from '../entities/complaint-history.entity';

@Injectable()
export class ComplaintsNotificationsService {
  private readonly logger = new Logger(ComplaintsNotificationsService.name);

  async notifyCitizenOnChange(citizen: CitizenEntity, history: ComplaintHistoryEntity): Promise<void> {
    this.logger.log(
      `Notify citizen(${citizen.id}) about complaint(${history.complaintId}) status=${history.status}`,
    );
  }
}
