import { z } from 'zod';
import { ENV_VALIDATION } from '../env.constant';
import { booleanTransformer } from '../transformers/boolean.transformer';

export const mailSchema = z.object({
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),

  SMTP_PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int())
    .refine(
      (val) => ENV_VALIDATION.SMTP_PORTS.includes(val),
      `SMTP_PORT must be one of: ${ENV_VALIDATION.SMTP_PORTS.join(', ')}`,
    ),

  SMTP_SECURE: z.union([z.boolean(), z.string().transform(booleanTransformer)]),

  SMTP_USER: z.string().email('SMTP_USER must be a valid email address'),

  SMTP_PASS: z.string().min(16, 'SMTP_PASS must be at least 16 characters long'),

  SMTP_FROM: z.string().email('SMTP_FROM must be a valid email address'),
});

export type MailConfig = z.infer<typeof mailSchema>;
