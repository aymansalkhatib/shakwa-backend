import { z } from 'zod';

export const mailSchema = z.object({
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email address'),

  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),

  // Mail provider selection (resend or sendgrid or smtp)
  MAIL_PROVIDER: z.enum(['resend', 'sendgrid', 'smtp']).default('resend'),

  // SendGrid API key (optional, only required if using SendGrid)
  SENDGRID_API_KEY: z.string().min(1, 'SendGrid API Key is required when using SendGrid'),

  // SMTP Configuration (optional, only required if using SMTP)
  SMTP_HOST: z.string().min(1, 'SMTP Host is required when using SMTP'),
  SMTP_PORT: z.coerce.number().min(1, 'SMTP Port is required when using SMTP'),
  SMTP_USER: z.string().min(1, 'SMTP User is required when using SMTP'),
  SMTP_PASS: z.string().min(1, 'SMTP Password is required when using SMTP'),
});

export type MailConfig = z.infer<typeof mailSchema>;
