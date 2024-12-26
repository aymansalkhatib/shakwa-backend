import * as winston from 'winston';
import 'winston-daily-rotate-file';

const FILE_CONFIG = {
  MAX_DAYS: '30d',
  DATE_PATTERN: 'YYYY-MM-DD',
  BASE_DIR: 'logs/%DATE%',
  EXTENSION: '.log',
  ERROR_FILE: 'error',
  COMBINED_FILE: 'combined',
} as const;

interface RotateFileConfig {
  filename: string;
  level?: string;
  format?: winston.Logform.Format;
  condition?: (info: any) => boolean;
}

function createFileFormat(format?: winston.Logform.Format): winston.Logform.Format {
  return winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
    format || winston.format.simple(),
  );
}

export const createDailyRotateTransport = ({
  filename,
  level,
  format,
  condition,
}: RotateFileConfig): winston.transport => {
  const transport = new winston.transports.DailyRotateFile({
    dirname: FILE_CONFIG.BASE_DIR,
    filename: `${filename}${FILE_CONFIG.EXTENSION}`,
    datePattern: FILE_CONFIG.DATE_PATTERN,
    maxFiles: FILE_CONFIG.MAX_DAYS,
    format: createFileFormat(format),
    level,
  });

  if (condition) {
    const originalWrite = transport.write.bind(transport);
    transport.write = (
      chunk: any,
      encoding?: BufferEncoding | ((error?: Error) => void),
      callback?: (error?: Error) => void,
    ) => {
      const cb = typeof encoding === 'function' ? encoding : callback;
      const info = typeof chunk === 'object' ? chunk : { chunk, encoding };

      if (condition(info)) {
        return originalWrite(chunk, encoding as BufferEncoding, callback);
      }

      if (cb) {
        cb();
      }
      return true;
    };
  }

  return transport;
};

// Create all file transports
export const createFileTransports = (
  customFormat: winston.Logform.Format,
): winston.transport[] => {
  return [
    createDailyRotateTransport({
      filename: FILE_CONFIG.ERROR_FILE,
      level: 'error',
      format: customFormat,
      condition: (info) => info.level_.toString().toLowerCase() === 'error',
    }),

    createDailyRotateTransport({
      filename: FILE_CONFIG.COMBINED_FILE,
      level: 'info',
      format: customFormat,
      condition: (info) => {
        return info.level_.toString().toLowerCase() !== 'error';
      },
    }),
  ];
};
