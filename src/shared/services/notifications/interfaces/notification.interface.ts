// File: interfaces/notification.interface.ts
import { FirebaseError } from 'firebase-admin/app';
import {
  SingleTokenNotificationDto,
  TokensNotificationDto,
  TopicNotificationDto,
} from '../dto/notification.dto';

export interface BatchResponse {
  successCount: number;
  failureCount: number;
  failures: { index: number; error: Error | FirebaseError }[];
}

export interface INotificationService {
  sendToToken(notification: SingleTokenNotificationDto): Promise<string>;

  sendToTokens(notification: TokensNotificationDto): Promise<BatchResponse>;

  sendToTopic(notification: TopicNotificationDto): Promise<string>;

  subscribeToTopic(tokens: string[], topic: string): Promise<void>;

  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
}
