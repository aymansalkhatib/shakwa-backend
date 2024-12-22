import { lookup } from 'mime-types';
import { SupportedFileType } from '../types/file.types';
import { extname } from 'path';

export const buildFileTypeRegex = (fileTypes: SupportedFileType[]): RegExp => {
  const validMimeTypes = fileTypes
    .map((type) => lookup(type))
    .filter((mimeType) => mimeType !== false);

  return new RegExp(validMimeTypes.join('|'));
};

export function renameFile(originalName: string): string {
  const fileExtension = extname(originalName);
  const randomNumber = Math.floor(Math.random() * 10000);
  const currentDate = new Date().toISOString().replace(/:/g, '-');
  return `${currentDate}-${randomNumber}${fileExtension}`;
}
