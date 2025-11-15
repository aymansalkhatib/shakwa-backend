import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { FirebaseError } from 'firebase-admin/app';
import {
  BaseNotificationDto,
  SingleTokenNotificationDto,
  TokensNotificationDto,
  TopicNotificationDto,
} from './dto/notification.dto';
import { BatchResponse, INotificationService } from './interfaces/notification.interface';
import { FIREBASE_ADMIN } from './notification.constants';

type NotificationTarget = { token: string; topic?: never } | { topic: string; token?: never };

@Injectable()
export class FirebaseNotificationService implements INotificationService {
  private readonly logger = new Logger(FirebaseNotificationService.name);
  private readonly batchSize = 500;

  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App) {}

  async sendToToken(notification: SingleTokenNotificationDto): Promise<string> {
    const message = this.buildBaseMessage(notification, { token: notification.token });

    try {
      const response = await this.firebaseAdmin.messaging().send(message);

      this.logger.log(`Successfully sent notification to token ${notification.token}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to token ${notification.token}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async sendToTokens(notification: TokensNotificationDto): Promise<BatchResponse> {
    const { tokens, ...notificationData } = notification;
    const batches = this.createBatches(tokens);

    let successCount = 0;
    let failureCount = 0;
    const failures: { index: number; error: Error | FirebaseError }[] = [];

    const results = await Promise.allSettled(
      batches.map((batchTokens, batchIndex) =>
        this.firebaseAdmin
          .messaging()
          .sendEachForMulticast(this.buildMulticastMessage(notificationData, batchTokens))
          .then((response) => {
            successCount += response.successCount;
            failureCount += response.failureCount;

            response.responses.forEach((resp, index) => {
              if (!resp.success && resp.error) {
                failures.push({
                  index: batchIndex * this.batchSize + index,
                  error: resp.error,
                });
              }
            });
          }),
      ),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(`Batch ${index} failed`, result.reason);
      }
    });

    return { successCount, failureCount, failures };
  }

  async sendToTopic(notification: TopicNotificationDto): Promise<string> {
    const { topic, ...notificationData } = notification;
    const message = this.buildBaseMessage(notificationData, { topic });

    try {
      const response = await this.firebaseAdmin.messaging().send(message);
      this.logger.log(`Successfully sent notification to topic ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send notification to topic ${topic}`, (error as Error).stack);
      throw error;
    }
  }

  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.firebaseAdmin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Successfully subscribed ${tokens.length} tokens to topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to subscribe tokens to topic ${topic}`, (error as Error).stack);
      throw error;
    }
  }

  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.firebaseAdmin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Successfully unsubscribed ${tokens.length} tokens from topic: ${topic}`);
    } catch (error) {
      this.logger.error(`Failed to unsubscribe tokens from topic ${topic}`, (error as Error).stack);
      throw error;
    }
  }

  private buildBaseMessage(
    notification: BaseNotificationDto,
    target: NotificationTarget,
  ): admin.messaging.Message {
    const cleanedTarget: any = {};
    if (target.token) cleanedTarget.token = target.token;
    if (target.topic) cleanedTarget.topic = target.topic;

    return {
      ...cleanedTarget,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        ttl: notification.ttlInSeconds ? notification.ttlInSeconds * 1000 : undefined,
        priority: notification.priority || 'normal',
        notification: {
          sound: notification.sound || 'default',
          clickAction: notification.clickAction,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: notification.sound || 'default',
          },
        },
      },
    };
  }

  private buildMulticastMessage(
    notification: BaseNotificationDto,
    tokens: string[],
  ): admin.messaging.MulticastMessage {
    return {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
      android: {
        ttl: notification.ttlInSeconds ? notification.ttlInSeconds * 1000 : undefined,
        priority: notification.priority || 'normal',
        notification: {
          sound: notification.sound || 'default',
          clickAction: notification.clickAction,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: notification.sound || 'default',
          },
        },
      },
    };
  }

  private createBatches(tokens: string[]): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += this.batchSize) {
      batches.push(tokens.slice(i, i + this.batchSize));
    }
    return batches;
  }
}
