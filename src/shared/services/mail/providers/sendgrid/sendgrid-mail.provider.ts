import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import { AbstractMailProvider } from '../abstract-mail.provider';
import { SendMailOptions } from '../../interfaces/send-mail-options.interface';
import { SendMailResult } from '../../interfaces/send-mail-result.interface';
import { EnvironmentConfig } from '../../../../modules/app-config';

/**
 * SendGrid email provider implementation
 * Uses SendGrid API to send emails
 */
@Injectable()
export class SendGridMailProvider extends AbstractMailProvider {
  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    const apiKey = this.configService.getOrThrow<string>('SENDGRID_API_KEY');
    sgMail.setApiKey(apiKey);
  }

  /**
   * Send email using SendGrid API
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    this.validateMailOptions(options);

    try {
      const msg: sgMail.MailDataRequired = {
        to: options.to,
        from: options.from,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: Buffer.isBuffer(att.content) ? att.content.toString('base64') : att.content,
          type: att.contentType,
        })),
      };

      const result = await sgMail.send(msg);

      return {
        success: true,
        messageId: result[0]?.headers?.['x-message-id'] as string,
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.body?.errors?.[0]?.message || error?.message || 'Unknown error occurred',
      };
    }
  }
}
