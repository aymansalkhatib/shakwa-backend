import { extractFileFormat } from './extract_file_format';

/**
 * Generates a unique file name using original name, date, and time.
 *
 * @param originalName - The original file name (e.g., 'photo.jpg').
 * @param overrideExtension - Optional extension to use instead of the one from originalName (e.g., 'webp').
 * @returns A safe and unique file name (e.g., 'photo-20250409-102355891.jpg').
 */
export function createUniqueFileName(
  originalName: string,
  overrideExtension?: string,
): string {
  const originalExt = extractFileFormat(originalName);
  const finalExt = overrideExtension?.toLowerCase() || originalExt;

  const nameWithoutExt = originalName
    .replace(new RegExp(`\\.${originalExt}$`, 'i'), '')
    .replace(/\s+/g, '-');

  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');

  return `${nameWithoutExt}-${timestamp}.${finalExt}`;
}
