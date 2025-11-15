// File: firebase.provider.ts
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from '../../modules/app-config';
import { FIREBASE_ADMIN } from './notification.constants';

export const FirebaseAdminProvider = {
  provide: FIREBASE_ADMIN,
  inject: [ConfigService<EnvironmentConfig>],
  useFactory: (configService: ConfigService<EnvironmentConfig>) => {
    const serviceAccountRaw = configService.getOrThrow<string>('FIREBASE_SERVICE_ACCOUNT');
    const storageBucket = configService.getOrThrow<string>('STORAGE_BUCKET');

    let serviceAccount: admin.ServiceAccount;

    try {
      serviceAccount = JSON.parse(serviceAccountRaw);
    } catch (error) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT must be a valid JSON string');
    }

    if (!admin.apps.length) {
      return admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket,
      });
    }

    return admin.app();
  },
};
