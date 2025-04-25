import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { IMailData } from './mail-data.interface';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendMail(mailData: IMailData): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: mailData.to,
        subject: mailData.subject,
        template: mailData.template,
        context: mailData.context,
      });
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }
}
