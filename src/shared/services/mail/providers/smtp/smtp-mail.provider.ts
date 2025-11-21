import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { AbstractMailProvider } from '../abstract-mail.provider';
import { SendMailOptions } from '../../interfaces/send-mail-options.interface';
import { SendMailResult } from '../../interfaces/send-mail-result.interface';
import { EnvironmentConfig } from '../../../../modules/app-config';

/**
 * SMTP email provider implementation
 * Uses Nodemailer to send emails via SMTP
 */
@Injectable()
export class SmtpMailProvider extends AbstractMailProvider {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    super();
    const host = this.configService.getOrThrow<string>('SMTP_HOST');
    const port = this.configService.getOrThrow<number>('SMTP_PORT');
    const user = this.configService.getOrThrow<string>('SMTP_USER');
    const pass = this.configService.getOrThrow<string>('SMTP_PASS');

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  /**
   * Send email using SMTP
   */
  async sendMail(options: SendMailOptions): Promise<SendMailResult> {
    this.validateMailOptions(options);

    try {
      const info = await this.transporter.sendMail({
        from: options.from,
        to: Array.isArray(options.to) ? options.to.join(',') : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown SMTP error',
      };
    }
  }
}
