// File: notification.module.ts
import { Global, Module } from '@nestjs/common';
import { FirebaseNotificationService } from './firebase-notification.service';
import { FirebaseAdminProvider } from './firebase.provider';

@Global()
@Module({
  providers: [FirebaseAdminProvider, FirebaseNotificationService],
  exports: [FirebaseNotificationService],
})
export class NotificationModule {}
