import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { STORAGE_PROVIDER } from './interfaces/storage-provider.interface';
import { LocalStorageProvider } from './providers/local/local-storage.provider';
import { FirebaseAdminProvider } from '../notifications/providers/firebase/firebase.provider';

@Global()
@Module({
  providers: [
    FirebaseAdminProvider,
    {
      provide: STORAGE_PROVIDER,
      useClass: LocalStorageProvider,
    },
    StorageService,
  ],
  exports: [StorageService],
})
export class StorageModule {}
