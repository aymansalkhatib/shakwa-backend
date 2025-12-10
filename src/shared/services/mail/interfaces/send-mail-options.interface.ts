import { MailAttachment } from './mail-attachment.interface';

export interface SendMailOptions {
  to: string | string[];
  from: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: MailAttachment[];
}
