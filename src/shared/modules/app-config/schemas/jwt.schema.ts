import { z } from 'zod';

export const jwtSchema = z.object({
  // Access Token Configuration
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN: z.string().min(1, 'JWT_ACCESS_EXPIRES_IN is required'),

  // Refresh Token Configuration
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET is required'),
  JWT_REFRESH_EXPIRES_IN: z.string().min(1, 'JWT_REFRESH_EXPIRES_IN is required'),

  // Verification Token Configuration
  JWT_VERIFICATION_SECRET: z.string().min(1, 'JWT_VERIFICATION_SECRET is required'),
  JWT_VERIFICATION_EXPIRES_IN: z
    .string()
    .min(1, 'JWT_VERIFICATION_EXPIRES_IN is required'),
});

export type JwtConfig = z.infer<typeof jwtSchema>;
