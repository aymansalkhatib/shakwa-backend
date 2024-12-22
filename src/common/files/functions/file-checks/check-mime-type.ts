import { extname } from 'path';
import { NonEmptyArray, SupportedFileType } from '../../types/file.types';

export function checkMimeType(
  file: Express.Multer.File,
  allowedMimeTypes: NonEmptyArray<SupportedFileType>,
): boolean {
  const fileExt: string = extname(file.originalname).toLowerCase().slice(1);

  return (allowedMimeTypes as string[]).includes(fileExt);
}
