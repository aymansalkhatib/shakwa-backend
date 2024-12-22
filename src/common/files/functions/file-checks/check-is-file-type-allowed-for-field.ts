import { extname } from 'path';
import { NonEmptyArray, SupportedFileType } from '../../types/file.types';

export function checkIsFileTypeAllowedForField(
  file: Express.Multer.File,
  allowedFieldTypes: Record<string, NonEmptyArray<SupportedFileType>>,
): boolean {
  const allowedTypes = allowedFieldTypes[file.fieldname];

  if (!allowedTypes) return false;

  const fileExt: string = extname(file.originalname).toLowerCase().slice(1);

  return allowedTypes.includes(fileExt as SupportedFileType);
}
