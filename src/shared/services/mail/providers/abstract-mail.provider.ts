import { BadRequestException } from '@nestjs/common';
import { IMailProvider } from '../interfaces/mail-provider.interface';
import { SendMailOptions } from '../interfaces/send-mail-options.interface';
import { SendMailResult } from '../interfaces/send-mail-result.interface';

/**
 * Abstract base class for mail providers
 * Implements common validation logic
 */
export abstract class AbstractMailProvider implements IMailProvider {
  abstract sendMail(options: SendMailOptions): Promise<SendMailResult>;

  /**
   * Validate email options
   * Shared implementation for all providers
   */
  validateMailOptions(options: SendMailOptions): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Validate recipient
    if (
      !options.to ||
      (Array.isArray(options.to)
        ? options.to.length === 0 || options.to.some((email) => !emailRegex.test(email))
        : !emailRegex.test(options.to))
    ) {
      throw new BadRequestException(
        'Recipient email address is required and must be valid (string or string[])',
      );
    }

    // Validate subject
    if (!options.subject) {
      throw new BadRequestException('Email subject is required');
    }

    // Validate content
    if (!options.html && !options.text) {
      throw new BadRequestException('Either html or text content is required');
    }
  }
}
