import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendMail(mailData: ISendMailOptions): Promise<void> {
    this.validateMailData(mailData);

    try {
      await this.mailer.sendMail(mailData);
    } catch {
      throw new InternalServerErrorException('Failed to send email');
    }
  }

  async sendVerificationCode(
    to: string,
    code: string,
    username: string,
    email: string,
  ): Promise<void> {
    return this.sendMail({
      to,
      subject: 'Verify Your Email',
      template: 'verify-code',
      context: { code, username, email },
    });
  }

  private validateMailData(mailData: ISendMailOptions): void {
    const { to, subject, template, html, text } = mailData;

    if (!to) {
      throw new BadRequestException('Recipient email address is required');
    }

    if (!subject) {
      throw new BadRequestException('Email subject is required');
    }

    if (!template && !html && !text) {
      throw new BadRequestException('Either template or html/text content is required');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    const recipients = Array.isArray(to) ? to : [to];

    for (const recipient of recipients) {
      const email = typeof recipient === 'string' ? recipient : recipient?.address;

      if (!email || !emailRegex.test(email.trim())) {
        throw new BadRequestException(`Invalid email address: ${email}`);
      }
    }
  }
}
