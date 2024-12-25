import * as bytes from 'bytes';
import { FileSizeUnit, SupportedFileType } from '../../types/file.types';

export function checkFileSizeByType(
  file: Express.Multer.File,
  options: { sizeLimits: Record<SupportedFileType, FileSizeUnit> },
): boolean {
  const fileType = file.originalname.split('.').pop();

  const maxSize: number = bytes(options.sizeLimits[fileType] as string);

  if (!maxSize) return true;
  return file.size <= maxSize;
}
