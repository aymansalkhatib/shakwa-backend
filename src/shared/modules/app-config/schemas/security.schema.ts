import { z } from 'zod';

export const securitySchema = z.object({
  SUPER_ADMIN_PASSWORD: z
    .string()
    .min(8, 'SUPER_ADMIN_PASSWORD must be at least 8 characters long')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'SUPER_ADMIN_PASSWORD must contain at least one lowercase letter, one uppercase letter, one number, and one special character',
    ),
});

export type SecurityConfig = z.infer<typeof securitySchema>;
