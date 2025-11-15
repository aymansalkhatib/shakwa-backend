import { Global, Module } from '@nestjs/common';
import { FirebaseNotificationService } from './firebase-notification.service';
import { FirebaseAdminProvider } from './firebase.provider';

@Global()
@Module({
  exports: [FirebaseNotificationService],
  providers: [FirebaseAdminProvider, FirebaseNotificationService],
})
export class NotificationModule {}
