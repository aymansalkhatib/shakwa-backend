import { z } from 'zod';

export const mailSchema = z.object({
  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email address'),

  RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY is required'),
});

export type MailConfig = z.infer<typeof mailSchema>;
