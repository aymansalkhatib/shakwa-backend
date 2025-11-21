import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from '../../modules/app-config';
import { IMailProvider, MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { ITemplateProcessor, TEMPLATE_PROCESSOR } from './interfaces/template-processor.interface';
import { SendLoginLockedOptions } from './interfaces/send-login-locked-options';
import { SendVerificationCodeOptions } from './interfaces/send-verification-code.interface';

/**
 * Main mail service - Orchestrates email sending
 * Uses dependency injection to work with any email provider and template processor
 */
@Injectable()
export class MailService {
  private readonly from: string;

  constructor(
    @Inject(MAIL_PROVIDER) private readonly mailProvider: IMailProvider,
    @Inject(TEMPLATE_PROCESSOR) private readonly templateProcessor: ITemplateProcessor,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    this.from = this.configService.getOrThrow<string>('SMTP_FROM');
  }

  /**
   * Send verification code email
   */
  async sendVerificationCode(data: SendVerificationCodeOptions): Promise<boolean> {
    const html = await this.templateProcessor.renderTemplate('verify-code', {
      code: data.code,
      email: data.to,
    });

    const result = await this.mailProvider.sendMail({
      to: data.to,
      from: `Shakwa <${this.from}>`,
      subject: data.subject,
      html,
    });

    console.log(result);

    return result.success;
  }

  /**
   * Send login locked notification email
   */
  async sendLoginLockedNotification(data: SendLoginLockedOptions): Promise<boolean> {
    const html = await this.templateProcessor.renderTemplate('login-locked', {
      email: data.to,
      lockDuration: data.lockDuration || 'Unknown',
      lockedUntil: data.lockedUntil || 'Unknown',
      failedAttempts: data.failedAttempts ?? 'Unknown',
      ipAddress: data.ipAddress || 'Unknown',
    });

    const result = await this.mailProvider.sendMail({
      to: data.to,
      from: `Shakwa <${this.from}>`,
      subject: data.subject,
      html,
    });

    return result.success;
  }
}
