import {
  extractFileExtension,
  extractFileNameWithoutExtension,
} from './file-helper.functions.ts';

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
  const originalExt = extractFileExtension(originalName);
  let nameWithoutExt = extractFileNameWithoutExtension(originalName);

  // Replace spaces with dashes and remove the original extension from name
  nameWithoutExt = nameWithoutExt
    .replace(new RegExp(`\\.${originalExt}$`, 'i'), '') // Ensure the extension is removed
    .replace(/\s+/g, '-'); // Replace spaces with dashes

  // Generate a timestamp
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');

  // If overrideExtension is provided, use that; otherwise, use the original extension
  const fileExtension = overrideExtension || originalExt;

  return `${nameWithoutExt}-${timestamp}.${fileExtension}`;
}
