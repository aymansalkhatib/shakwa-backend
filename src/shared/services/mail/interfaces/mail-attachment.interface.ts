export interface MailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}
