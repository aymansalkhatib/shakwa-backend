import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  BatchResponse,
  INotificationService,
} from './interfaces/notification.interface';
import {
  TokensNotificationDto,
  TopicNotificationDto,
  SingleTokenNotificationDto,
} from './dto/notification.dto';
import { FirebaseError } from 'firebase-admin/app';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseNotificationService implements INotificationService {
  private readonly logger = new Logger(FirebaseNotificationService.name);
  private readonly batchSize = 500;

  constructor(
    @Inject('FIREBASE_ADMIN') private readonly firebaseAdmin: admin.app.App,
  ) {}

  /**
   * Send notification to a single token
   */
  async sendToToken(notification: SingleTokenNotificationDto): Promise<string> {
    try {
      const response = await this.firebaseAdmin.messaging().send({
        token: notification.token,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data,
        android: {
          ttl: notification.ttlInSeconds
            ? notification.ttlInSeconds * 1000
            : undefined,
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
      });

      this.logger.log(
        `Successfully sent notification to token ${notification.token}`,
      );
      return response;
    } catch (error) {
      this.logger.error(
        `Failed to send notification to token ${notification.token}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Send notification to multiple tokens with batching
   */
  async sendToTokens(notification: TokensNotificationDto): Promise<BatchResponse> {
    const { tokens, ...notificationData } = notification;
    const batches = this.createBatches(tokens);

    let totalSuccessCount = 0;
    let totalFailureCount = 0;
    const failures: { index: number; error: Error | FirebaseError }[] = [];

    try {
      const batchPromises = batches.map(async (batchTokens, batchIndex) => {
        try {
          const response = await this.firebaseAdmin
            .messaging()
            .sendEachForMulticast({
              tokens: batchTokens,
              notification: {
                title: notificationData.title,
                body: notificationData.body,
              },
              data: notificationData.data,
              android: {
                ttl: notificationData.ttlInSeconds
                  ? notificationData.ttlInSeconds * 1000
                  : undefined,
                priority: notificationData.priority || 'normal',
                notification: {
                  sound: notificationData.sound || 'default',
                  clickAction: notificationData.clickAction,
                },
              },
              apns: {
                payload: {
                  aps: {
                    sound: notificationData.sound || 'default',
                  },
                },
              },
            });

          totalSuccessCount += response.successCount;
          totalFailureCount += response.failureCount;

          // Record failures with adjusted indices
          response.responses.forEach((resp, index) => {
            if (!resp.success) {
              failures.push({
                index: batchIndex * this.batchSize + index,
                error: resp.error,
              });
            }
          });
        } catch (error) {
          this.logger.error(`Batch ${batchIndex} failed:`, error);
          throw error;
        }
      });

      await Promise.all(batchPromises);

      return {
        successCount: totalSuccessCount,
        failureCount: totalFailureCount,
        failures,
      };
    } catch (error) {
      this.logger.error('Failed to send notifications:', error);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(notification: TopicNotificationDto): Promise<string> {
    const { topic, ...notificationData } = notification;

    try {
      const response = await this.firebaseAdmin.messaging().send({
        topic,
        notification: {
          title: notificationData.title,
          body: notificationData.body,
        },
        data: notificationData.data,
        android: {
          ttl: notificationData.ttlInSeconds
            ? notificationData.ttlInSeconds * 1000
            : undefined,
          priority: notificationData.priority || 'normal',
          notification: {
            sound: notificationData.sound || 'default',
            clickAction: notificationData.clickAction,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: notificationData.sound || 'default',
            },
          },
        },
      });

      this.logger.log(`Successfully sent notification to topic ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Failed to send notification to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Subscribe tokens to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.firebaseAdmin.messaging().subscribeToTopic(tokens, topic);
      this.logger.log(
        `Successfully subscribed ${tokens.length} tokens to topic: ${topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to subscribe tokens to topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Unsubscribe tokens from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<void> {
    try {
      await this.firebaseAdmin.messaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(
        `Successfully unsubscribed ${tokens.length} tokens from topic: ${topic}`,
      );
    } catch (error) {
      this.logger.error(`Failed to unsubscribe tokens from topic ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Create batches of tokens with specified batch size
   */
  private createBatches(tokens: string[]): string[][] {
    const batches: string[][] = [];
    for (let i = 0; i < tokens.length; i += this.batchSize) {
      batches.push(tokens.slice(i, i + this.batchSize));
    }
    return batches;
  }
}
