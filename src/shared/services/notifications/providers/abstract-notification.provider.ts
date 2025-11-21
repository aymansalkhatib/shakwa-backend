import { BadRequestException } from '@nestjs/common';
import { INotificationProvider } from '../interfaces/notification-provider.interface';
import { BatchResponse } from '../interfaces/batch-response.interface';
import { SingleTokenNotificationOptions } from '../interfaces/single-token-notification-options.interface';
import { TokensNotificationOptions } from '../interfaces/tokens-notification-options.interface';
import { TopicNotificationOptions } from '../interfaces/topic-notification-options.interface';
import { BaseNotificationOptions } from '../interfaces/base-notification-options.interface';

/**
 * Abstract base class for notification providers
 * Implements common validation logic
 */
export abstract class AbstractNotificationProvider implements INotificationProvider {
  abstract sendToToken(options: SingleTokenNotificationOptions): Promise<string>;
  abstract sendToTokens(options: TokensNotificationOptions): Promise<BatchResponse>;
  abstract sendToTopic(options: TopicNotificationOptions): Promise<string>;
  abstract subscribeToTopic(tokens: string[], topic: string): Promise<void>;
  abstract unsubscribeFromTopic(tokens: string[], topic: string): Promise<void>;

  /**
   * Validate base notification options
   */
  protected validateBaseOptions(options: BaseNotificationOptions): void {
    if (!options.title) {
      throw new BadRequestException('Notification title is required');
    }
    if (!options.body) {
      throw new BadRequestException('Notification body is required');
    }
  }

  /**
   * Validate single token options
   */
  protected validateSingleTokenOptions(options: SingleTokenNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!options.token) {
      throw new BadRequestException('Target token is required');
    }
  }

  /**
   * Validate tokens options
   */
  protected validateTokensOptions(options: TokensNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!options.tokens || !Array.isArray(options.tokens) || options.tokens.length === 0) {
      throw new BadRequestException('Target tokens are required and must be a non-empty array');
    }
  }

  /**
   * Validate topic options
   */
  protected validateTopicOptions(options: TopicNotificationOptions): void {
    this.validateBaseOptions(options);
    if (!options.topic) {
      throw new BadRequestException('Target topic is required');
    }
  }
}
