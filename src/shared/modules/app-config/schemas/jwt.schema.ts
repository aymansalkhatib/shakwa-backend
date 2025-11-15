import { z } from 'zod';

export const jwtSchema = z.object({
  // Access Token Configuration
  JWT_ACCESS_SECRET: z.string().min(1, 'JWT_ACCESS_SECRET is required'),
  JWT_ACCESS_EXPIRES_IN_MS: z.coerce
    .number()
    .int()
    .positive('JWT_ACCESS_EXPIRES_IN_MS must be a positive number'),

  STORAGE_BUCKET: z.string().min(1, 'STORAGE_BUCKET is required'),

  FIREBASE_SERVICE_ACCOUNT: z.string().min(1, 'FIREBASE_SERVICE_ACCOUNT is required'),

});
