export function checkFileIsNotEmpty(file: Express.Multer.File): boolean {
  return file.size > 0;
}
