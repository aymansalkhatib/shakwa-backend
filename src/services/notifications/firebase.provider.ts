import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { EnvironmentConfig } from 'src/shared/modules/app-config/env.schema';

export const FirebaseAdminProvider = {
  provide: 'FIREBASE_ADMIN',
  inject: [ConfigService<EnvironmentConfig>],

  useFactory: (configService: ConfigService<EnvironmentConfig>) => {
    if (!admin.apps.length) {
      const serviceAccount = configService.get<string>('FIREBASE_SERVICE_ACCOUNT');
      return admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(serviceAccount)),
        storageBucket: configService.get<string>('STORAGE_BUCKET'),
      });
    }
    return admin.app();
  },
};
