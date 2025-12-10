import { BatchResponse } from './batch-response.interface';
import { SingleTokenNotificationOptions } from './single-token-notification-options.interface';
import { TokensNotificationOptions } from './tokens-notification-options.interface';
import { TopicNotificationOptions } from './topic-notification-options.interface';

/**
 * Interface for notification provider implementations
 * All providers (Firebase, etc.) must implement this interface
 */
export interface INotificationProvider {
  /**
   * Send notification to a single token
   */
  sendToToken(options: SingleTokenNotificationOptions): Promise<string>;

  /**
   * Send notification to multiple tokens
   */
  sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse>;

  /**
   * Send notification to a topic
   */
  sendToTopic(options: TopicNotificationOptions): Promise<string>;

  /**
   * Subscribe tokens to a topic
   */
  subscribeToTopic(tokens: string[], topic: string): Promise<void>;

  /**
   * Unsubscribe tokens from a topic
   */
  unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;
}

export const NOTIFICATION_PROVIDER = Symbol('NOTIFICATION_PROVIDER');
