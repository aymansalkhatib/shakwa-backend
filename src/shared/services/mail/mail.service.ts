import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { CreateEmailOptions, Resend } from 'resend';
import { EnvironmentConfig } from '../../modules/app-config';
import { SendVerificationCodeOptions } from './interfaces/send-verification-code.interface';

type MailTemplateData = Record<string, any>;

@Injectable()
export class MailService {
  private readonly resend: Resend;
  private readonly templateCache: Map<string, string> = new Map();
  private readonly templatesPath: string;
  private readonly from: string;
  constructor(private readonly configService: ConfigService<EnvironmentConfig>) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    this.resend = new Resend(apiKey);
    this.templatesPath = path.join(__dirname, 'templates');
    this.from = this.configService.getOrThrow<string>('SMTP_FROM');
  }

  async sendVerificationCode(data: SendVerificationCodeOptions): Promise<boolean> {
    const html = await this.renderTemplate('verify-code', {
      code: data.code,
      email: data.to,
    });

    return this.sendMail({
      to: data.to,
      from: `Shakwa<${this.from}>`,
      subject: data.subject,
      html,
    });
  }

  private async sendMail(mailData: CreateEmailOptions): Promise<boolean> {
    this.validateMailData(mailData);
    const result = await this.resend.emails.send(mailData);
    console.log(result);
    if (result && result.data == null) return false;
    return true;
  }

  private async renderTemplate(templateName: string, data: MailTemplateData): Promise<string> {
    const template = await this.loadTemplate(templateName);

    return template.replace(/{{\s*(\w+)\s*}}/g, (_, key: string) => {
      const value = (data as Record<string, unknown>)[key];
      if (value === undefined || value === null) {
        throw new BadRequestException(`Missing template value for key: ${key}`);
      }
      return String(value);
    });
  }

  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesPath, `${templateName}.html`);
    const cached = this.templateCache.get(templatePath);
    if (cached) {
      return cached;
    }

    try {
      const template = await fs.readFile(templatePath, 'utf-8');
      this.templateCache.set(templatePath, template);
      return template;
    } catch (err) {
      throw new InternalServerErrorException(`Email template "${templateName}" not found`);
    }
  }

  private validateMailData(mailData: CreateEmailOptions): void {
    const { to, from, subject, html, text, react } = mailData;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !to ||
      (Array.isArray(to)
        ? to.length === 0 || to.some((email) => !emailRegex.test(email))
        : !emailRegex.test(to))
    ) {
      throw new BadRequestException(
        'Recipient email address is required and must be a valid email (string or string[])',
      );
    }

    if (!from || !emailRegex.test(from)) {
      throw new BadRequestException('Sender email address is required and must be a valid email');
    }

    if (!subject) {
      throw new BadRequestException('Email subject is required');
    }

    if (!html && !text && !react) {
      throw new BadRequestException('Either html, text, or react content is required');
    }
  }
}
