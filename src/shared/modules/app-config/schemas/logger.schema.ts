import { z } from 'zod';
import { booleanTransformer } from '../transformers/boolean.transformer';
  
export const loggerSchema = z.object({
  // Log level configuration
  LOG_LEVEL: z
    .enum(['error', 'warn', 'info', 'debug', 'verbose'])
    .default('info')
    .describe('Minimum log level to output'),

  // Log directory
  LOG_DIR: z.string().default('./logs').describe('Directory to store log files'),

  // File rotation settings
  LOG_MAX_SIZE: z
    .string()
    .default('20m')
    .describe('Maximum size of log file before rotation (e.g., 20m, 100k)'),

  LOG_MAX_FILES: z
    .string()
    .default('14d')
    .describe('Maximum number of days to keep log files (e.g., 14d, 30d)'),

  LOG_ERROR_MAX_FILES: z
    .string()
    .default('30d')
    .describe('Maximum number of days to keep error log files'),

  // Compression
  LOG_ZIP_ARCHIVE: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(true)
    .describe('Whether to compress old log files'),

  // Console logging
  LOG_CONSOLE: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(true)
    .describe('Whether to output logs to console'),

  // HTTP request logging
  LOG_HTTP: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(true)
    .describe('Whether to log HTTP requests'),

  // Performance logging
  LOG_SLOW_REQUESTS: z
    .union([z.boolean(), z.string().transform(booleanTransformer)])
    .default(true)
    .describe('Whether to log slow requests'),

  LOG_SLOW_REQUEST_THRESHOLD: z
    .string()
    .default('1000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive().int())
    .describe('Threshold in milliseconds for slow request logging'),
});

export type LoggerConfig = z.infer<typeof loggerSchema>;
