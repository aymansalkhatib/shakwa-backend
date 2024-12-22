export function checkIsValidNameFile(file: Express.Multer.File) {
  const regex = /^[\u0600-\u06FFa-zA-Z0-9_.\-()!@#\$%\^&+= ]+$/;
  return regex.test(file.originalname);
}
