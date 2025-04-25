import { z } from 'zod';
import { ENV_VALIDATION } from '../env.constant';
 
export const securitySchema = z.object({
  JWT_SECRET: z
    .string()
    .min(
      ENV_VALIDATION.MIN_JWT_LENGTH,
      `JWT secret should be at least ${ENV_VALIDATION.MIN_JWT_LENGTH} characters long`,
    ),
});

export type SecurityConfig = z.infer<typeof securitySchema>;