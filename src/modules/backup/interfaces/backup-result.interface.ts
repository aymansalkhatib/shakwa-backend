export interface BackupResult {
  success: boolean;
  fileName: string;
  size: number;
  duration: number;
  uploadedTo: string;
  createdAt: string;
}
