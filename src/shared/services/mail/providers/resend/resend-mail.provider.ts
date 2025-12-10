import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AbstractMailProvider } from '../abstract-mail.provider';
import { SendMailOptions } from '../../interfaces/send-mail-options.interface';
import { SendMailResult } from '../../interfaces/send-mail-result.interface';
import { EnvironmentConfig } from '../../../../modules/app-config';

/**
 * Resend email provider implementation
 * Uses Resend API to send emails
 */
@Injectable()
export class ResendMailProvider extends AbstractMailProvider {
  private readonly resend: Resend;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    const apiKey = this.configService.getOrThrow<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
  }

  /**
   * Send email using Resend API
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    this.validateMailOptions(options);

    try {
      const result = await this.resend.emails.send({
        to: options.to,
        from: options.from,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
        })),
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        messageId: result.data?.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
