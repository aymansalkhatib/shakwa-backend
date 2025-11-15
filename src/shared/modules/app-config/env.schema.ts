import { z } from 'zod';
import {
  databaseSchema,
  jwtSchema,
  loggerSchema,
  mailSchema,
  rateLimitSchema,
  securitySchema,
  serverSchema,
  storageSchema,
} from './schemas';

export const environmentSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...securitySchema.shape,
  ...jwtSchema.shape,
  ...mailSchema.shape,
  ...storageSchema.shape,
  ...rateLimitSchema.shape,
  ...loggerSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
