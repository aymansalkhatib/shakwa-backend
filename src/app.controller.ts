import { Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { ConfigService } from '@nestjs/config';
import { EnvironmentConfig } from './shared/modules/app-config/env.schema';
import { MailService } from './services/mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get()
  async getHello() {
    try {
      await this.mailService.sendMail({
        to: 'test@example.com',
        subject: 'Welcome to the New Project',
        template: 'welcome',
        context: {
          username: 'John Doe',
          message:
            'We are excited to welcome you to our platform! Your account has been successfully created, and we are thrilled to have you with us.',
        },
      });
    } catch (e) {
      return e.toString();
    }

    return this.appService.getHello();
  }
}
