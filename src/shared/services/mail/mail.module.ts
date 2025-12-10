import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { MAIL_PROVIDER } from './interfaces/mail-provider.interface';
import { TEMPLATE_PROCESSOR } from './interfaces/template-processor.interface';
import { ResendMailProvider } from './providers/resend/resend-mail.provider';
import { SendGridMailProvider } from './providers/sendgrid/sendgrid-mail.provider';
import { SmtpMailProvider } from './providers/smtp/smtp-mail.provider';
import { TemplateProcessor } from './processors/template.processor';
import { EnvironmentConfig } from '../../modules/app-config';

/**
 * Mail Module
 * Provides email sending capabilities with support for multiple providers
 */
@Module({
  providers: [
    // Template Processor
    {
      provide: TEMPLATE_PROCESSOR,
      useClass: TemplateProcessor,
    },
    // Mail Provider Factory - selects provider based on environment variable
    {
      provide: MAIL_PROVIDER,
      useClass: SmtpMailProvider,
    },
    // Main Mail Service
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
