import * as winston from 'winston';
import 'winston-daily-rotate-file';

interface RotateFileConfig {
  filename: string;
  level?: string;
  format?: winston.Logform.Format;
}

export const createDailyRotateTransport = ({
  filename,
  level,
  format,
}: RotateFileConfig): winston.transport => {
  return new winston.transports.DailyRotateFile({
    dirname: 'logs/%DATE%',
    filename: `${filename}.log`,
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d',
    format: format || winston.format.combine(winston.format.timestamp()),
    level,
  });
};

export const createFileTransports = (
  customFormat: winston.Logform.Format,
): winston.transport[] => {
  return [
    createDailyRotateTransport({
      filename: 'error',
      level: 'error',
      format: customFormat,
    }),

    createDailyRotateTransport({
      filename: 'combined',
      format: customFormat,
    }),
  ];
};
