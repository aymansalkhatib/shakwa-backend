import { z } from 'zod';

export const jwtSchema = z.object({
  // Access Token Configuration
  JWT_ACCESS_SECRET: z
    .string()
    .min(16, 'JWT_ACCESS_SECRET must be at least 16 characters for security'),

  JWT_ACCESS_EXPIRES_IN_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('JWT_ACCESS_EXPIRES_IN_MS must be a positive number')),

  // Refresh Token Configuration
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters for security')
    .optional(),

  JWT_REFRESH_EXPIRES_IN_MS: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('JWT_REFRESH_EXPIRES_IN_MS must be a positive number'))
    .optional(),
});

export type JwtConfig = z.infer<typeof jwtSchema>;
