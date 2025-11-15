import { z } from 'zod';

export const rateLimitSchema = z.object({
  RATE_LIMIT_TTL: z
    .string()
    .default('60')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'RATE_LIMIT_TTL must be greater than 0'),

  RATE_LIMIT_MAX: z
    .string()
    .default('100')
    .transform((val) => parseInt(val, 10))
    .refine((val) => val > 0, 'RATE_LIMIT_MAX must be greater than 0'),
});

export type RateLimitConfig = z.infer<typeof rateLimitSchema>;
