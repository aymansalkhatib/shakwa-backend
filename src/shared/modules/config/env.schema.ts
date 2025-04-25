import { z } from 'zod';
import { databaseSchema, mailSchema, securitySchema, serverSchema } from './schemas';

export const environmentSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...securitySchema.shape,
  ...mailSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
