import { Inject, Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { BatchResponse } from '../../interfaces/batch-response.interface';
import { AbstractNotificationProvider } from '../abstract-notification.provider';
import { SingleTokenNotificationOptions } from '../../interfaces/single-token-notification-options.interface';
import { TokensNotificationOptions } from '../../interfaces/tokens-notification-options.interface';
import { TopicNotificationOptions } from '../../interfaces/topic-notification-options.interface';
import { BaseNotificationOptions } from '../../interfaces/base-notification-options.interface';
import { FIREBASE_ADMIN } from '../../constants/notification.token';

type NotificationTarget = { token: string; topic?: never } | { topic: string; token?: never };

@Injectable()
export class FirebaseNotificationProvider extends AbstractNotificationProvider {
  private readonly logger = new Logger(FirebaseNotificationProvider.name);
  private readonly batchSize = 500;

  constructor(@Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: admin.app.App) {
    super();
  }

  async sendToToken(options: SingleTokenNotificationOptions): Promise<string> {
    this.validateSingleTokenOptions(options);
    const message = this.buildBaseMessage(options, { token: options.token });

    try {
      const response = await this.firebaseAdmin.messaging().send(message);
      this.logger.log(`Successfully sent notification to token ${options.token}`);
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to token ${options.token}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  async sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse> {
    this.validateTokensOptions(options);
    const { tokens, ...notificationData } = options;
    const batches = this.createBatches(tokens);

    let successCount = 0;
    let failureCount = 0;
    const failures: { index: number; error: Error }[] = [];

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
                  error: resp.error as any,
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

  async sendToTopic(options: TopicNotificationOptions): Promise<string> {
    this.validateTopicOptions(options);
    const { topic, ...notificationData } = options;
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
    notification: BaseNotificationOptions,
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
    notification: BaseNotificationOptions,
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
