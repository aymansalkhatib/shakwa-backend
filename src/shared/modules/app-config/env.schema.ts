import { z } from 'zod';
import { databaseSchema, mailSchema, serverSchema, jwtSchema } from './schemas';

export const environmentSchema = z.object({
  ...serverSchema.shape,
  ...databaseSchema.shape,
  ...mailSchema.shape,
  ...jwtSchema.shape,
});

export type EnvironmentConfig = z.infer<typeof environmentSchema>;
