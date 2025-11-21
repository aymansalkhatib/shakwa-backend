import { Inject, Injectable } from '@nestjs/common';
import {
  INotificationProvider,
  NOTIFICATION_PROVIDER,
} from './interfaces/notification-provider.interface';
import { SingleTokenNotificationOptions } from './interfaces/single-token-notification-options.interface';
import { TokensNotificationOptions } from './interfaces/tokens-notification-options.interface';
import { TopicNotificationOptions } from './interfaces/topic-notification-options.interface';
import { BatchResponse } from './interfaces/batch-response.interface';

@Injectable()
export class NotificationService {
  constructor(
    @Inject(NOTIFICATION_PROVIDER) private readonly notificationProvider: INotificationProvider,
  ) {}

  async sendToToken(options: SingleTokenNotificationOptions): Promise<string> {
    return this.notificationProvider.sendToToken(options);
  }

  async sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse> {
    return this.notificationProvider.sendToTokens(options);
  }

  async sendToTopic(options: TopicNotificationOptions): Promise<string> {
    return this.notificationProvider.sendToTopic(options);
  } 

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    return this.notificationProvider.subscribeToTopic(tokens, topic);
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    return this.notificationProvider.unsubscribeFromTopic(tokens, topic);
  }
}
