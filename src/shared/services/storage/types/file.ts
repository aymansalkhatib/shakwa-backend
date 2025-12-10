/**
 * All supported MIME file types within the system.
 */
export type SupportedFileType =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'pdf'
  | 'mp4'
  | 'ogg'
  | 'txt'
  | 'mp3'
  | 'docx';

/**
 * Standard file size format. Example: '5MB', '100KB'.
 */
export type FileSizeUnit = `${number}${'KB' | 'MB' | 'GB' | 'TB'}`;

/**
 * Represents a non-empty array (at least one element is required).
 */
export type NonEmptyArray<T> = [T, ...T[]];

/**
 * Represents different types of file uploads that can be processed.
 */
export type FileUpload =
  | Express.Multer.File
  | Express.Multer.File[]
  | Record<string, Express.Multer.File[]>;

/**
 * Structure for nested file uploads with multiple fields.
 */
export interface NestedFileUpload {
  [key: string]: Express.Multer.File[];
}
