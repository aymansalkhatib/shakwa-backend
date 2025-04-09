/**
 * Extracts image format from filename
 */
export function extractFileFormat(filename: string): string {

  return filename.split('.').pop()?.toLowerCase();
}
