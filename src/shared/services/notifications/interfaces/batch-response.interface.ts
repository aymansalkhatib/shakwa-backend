import { FirebaseError } from 'firebase-admin/app';

export interface BatchResponse {
  successCount: number;
  failureCount: number;
  failures: { index: number; error: Error | FirebaseError }[];
}
