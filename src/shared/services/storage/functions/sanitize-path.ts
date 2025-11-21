import * as path from 'path';

/**
 * Sanitizes a file path to prevent path traversal attacks
 * Removes dangerous patterns like ../, ..\, leading slashes, and normalizes the path
 *
 * @param filepath - The path to sanitize
 * @returns A safe, normalized path string
 *
 * @example
 * sanitizePath('../../../etc/passwd') // returns 'etc/passwd'
 * sanitizePath('//uploads/file.txt') // returns 'uploads/file.txt'
 * sanitizePath('folder/../file.txt') // returns 'file.txt'
 */
export function sanitizePath(filepath: string): string {
  if (!filepath || typeof filepath !== 'string') {
    return '';
  }

  // Remove null bytes
  let sanitized = filepath.replace(/\0/g, '');

  // Normalize the path (resolves .., ., etc.)
  sanitized = path.normalize(sanitized);

  // Remove leading slashes and backslashes
  sanitized = sanitized.replace(/^[\/\\]+/, '');

  // Remove parent directory references
  sanitized = sanitized.replace(/\.\.[\/\\]/g, '');

  // If the path still starts with .., remove it
  if (sanitized.startsWith('..')) {
    sanitized = sanitized.substring(2);
  }

  // Remove any remaining leading slashes
  sanitized = sanitized.replace(/^[\/\\]+/, '');

  // Convert backslashes to forward slashes for consistency
  sanitized = sanitized.replace(/\\/g, '/');

  return sanitized;
}

/**
 * Validates if a filename is safe (no path separators)
 *
 * @param filename - The filename to validate
 * @returns true if the filename is safe
 */
export function isValidFilename(filename: string): boolean {
  if (!filename || typeof filename !== 'string') {
    return false;
  }

  // Check for path separators
  if (filename.includes('/') || filename.includes('\\')) {
    return false;
  }

  // Check for parent directory references
  if (filename.includes('..')) {
    return false;
  }

  // Check for null bytes
  if (filename.includes('\0')) {
    return false;
  }

  return true;
}
