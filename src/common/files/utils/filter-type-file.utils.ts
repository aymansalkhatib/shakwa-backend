export function isSingleFile(file: any): boolean {
  return file && file.size !== undefined && file.originalname !== undefined;
}

export function isArrayOfFiles(files: any): boolean {
  return Array.isArray(files);
}

function checkSingleFile(
  file: Express.Multer.File,
  callback: (file: Express.Multer.File) => boolean,
): boolean {
  return callback(file);
}

function checkArrayOfFiles(
  files: Express.Multer.File[],
  callback: (file: Express.Multer.File) => boolean,
): boolean {
  for (const file of files) {
    if (!callback(file)) {
      return false;
    }
  }
  return true;
}

function checkMultipleFiles(
  files: any,
  callback: (file: Express.Multer.File) => boolean,
): boolean {
  for (const key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const filesArray = files[key];
      if (Array.isArray(filesArray)) {
        for (const file of filesArray) {
          if (!callback(file)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

export function processFilesBasedOnType<T>(
  files: any,
  callback: (file: Express.Multer.File, options: T) => boolean,
  options: T = null,
): boolean {
  if (isSingleFile(files)) {
    return checkSingleFile(files, (file) => callback(file, options));
  } else if (isArrayOfFiles(files)) {
    return checkArrayOfFiles(files, (file) => callback(file, options));
  } else {
    return checkMultipleFiles(files, (file) => callback(file, options));
  }
}
