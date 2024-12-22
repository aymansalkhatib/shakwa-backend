import * as bytes from 'bytes';
import { FileSizeUnit, SupportedFileType } from '../../types/file.types';

export function checkFileSizeByType(
  file: Express.Multer.File,
  options: { sizeLimits: Record<SupportedFileType, FileSizeUnit> },
): boolean {
  const fileType = file.mimetype.split('/')[1];

  const maxSize: number = bytes(options.sizeLimits[fileType].toString() as string);

  if (!maxSize) return true;
  return file.size <= maxSize;
}
