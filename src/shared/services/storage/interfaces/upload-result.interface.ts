/**
 * Result of a file upload operation
 */
export interface UploadResult {
  /** Public URL to access the uploaded file */
  url: string;
  /** Storage path of the uploaded file */
  path: string;
  /** Optional unique key/identifier for the file */
  key?: string;
}
