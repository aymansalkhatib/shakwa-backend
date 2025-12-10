// File: notification.module.ts
import { Module } from '@nestjs/common';
import { FirebaseAdminProvider } from './providers/firebase/firebase.provider';
import { NotificationService } from './notification.service';
import { FirebaseNotificationProvider } from './providers/firebase/firebase-notification.provider';
import { NOTIFICATION_PROVIDER } from './interfaces/notification-provider.interface';

@Module({
  providers: [
    FirebaseAdminProvider,
    {
      provide: NOTIFICATION_PROVIDER,
      useClass: FirebaseNotificationProvider,
    },
    NotificationService,
  ],
  exports: [NotificationService],
})
export class NotificationModule {}
