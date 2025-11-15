import { z } from 'zod';
import {
  databaseSchema,
  jwtSchema,
  mailSchema,
  securitySchema,
  serverSchema,
  storageSchema
} from './schemas';

export const environmentSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...securitySchema.shape,
  ...jwtSchema.shape,
  ...mailSchema.shape,
  ...storageSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
