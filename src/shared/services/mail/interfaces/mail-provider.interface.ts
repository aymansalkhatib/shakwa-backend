import { SendMailOptions } from './send-mail-options.interface';
import { SendMailResult } from './send-mail-result.interface';

/**
 * Interface for email provider implementations
 * All providers (Resend, SendGrid, etc.) must implement this interface
 */
export interface IMailProvider {
  /**
   * Send an email using the provider's API
   * @param options Email options including recipient, subject, and content
   * @returns Promise with send result
   */
  sendMail(options: SendMailOptions): Promise<SendMailResult>;

  /**
   * Validate email options before sending
   * @param options Email options to validate
   * @throws BadRequestException if validation fails
   */
  validateMailOptions(options: SendMailOptions): void;
}

export const MAIL_PROVIDER = Symbol('MAIL_PROVIDER');
