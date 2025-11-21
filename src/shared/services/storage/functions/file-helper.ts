/**
 * Extracts image format (extension) from filename
 *
 * @param filename - The filename to extract the extension from
 * @returns The file extension in lowercase
 */
export function extractFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''; // Ensure there's a valid extension
}

/**
 * Extracts the filename without the extension
 *
 * @param filename - The filename to extract the name without the extension
 * @returns The filename without the extension
 */
export function extractFileNameWithoutExtension(filename: string): string {
  const parts = filename.split('.');
  parts.pop(); // Remove the extension part
  return parts.join('.'); // Return the filename without the extension
}
