/**
 * Checks whether the given object represents a **single uploaded file**.
 * This is determined by verifying typical multer file properties like `size` and `originalname`.
 */
export function isSingleFile(file: any): boolean {
  return file && file.size !== undefined && file.originalname !== undefined;
}

/**
 * Checks whether the input is an **array of uploaded files**.
 * Typically used when multiple files are uploaded using the same field name.
 */
export function isArrayOfFiles(files: any): boolean {
  return Array.isArray(files);
}

/**
 * Validates a **single file** using the provided validation function.
 *
 * @param file - A single file to validate
 * @param validator - A function that performs validation logic on the file
 * @returns `true` if the file is valid, `false` otherwise
 */
function validateSingleFile(
  file: Express.Multer.File,
  validator: (file: Express.Multer.File) => boolean,
): boolean {
  return validator(file);
}

/**
 * Validates a **collection of files** (array of files) using the provided validator.
 *
 * @param files - An array of files to validate
 * @param validator - A validation function applied to each file
 * @returns `true` if all files pass validation, `false` if any file fails
 */
function validateFileCollection(
  files: Express.Multer.File[],
  validator: (file: Express.Multer.File) => boolean,
): boolean {
  for (const file of files) {
    if (!validator(file)) {
      return false;
    }
  }
  return true;
}

/**
 * Validates a **grouped file structure** such as:
 * {
 *   images: [file1, file2],
 *   documents: [file3, file4],
 *   ...
 * }
 * Often used in `@UploadedFiles()` with named fields.
 *
 * @param files - An object with arrays of files grouped by field names
 * @param validator - A validation function applied to each file in all groups
 * @returns `true` if all files across all groups pass validation, otherwise `false`
 */
function validateFileGroups(
  files: Record<string, Express.Multer.File[]>,
  validator: (file: Express.Multer.File) => boolean,
): boolean {
  for (const fieldName in files) {
    if (Object.prototype.hasOwnProperty.call(files, fieldName)) {
      const fileGroup = files[fieldName];
      if (Array.isArray(fileGroup)) {
        for (const file of fileGroup) {
          if (!validator(file)) {
            return false;
          }
        }
      }
    }
  }
  return true;
}

/**
 * Validates uploaded files (single, multiple, or grouped) based on their structure.
 * This function adapts automatically to the file structure provided by Multer and applies the given validation logic.
 *
 * @template T - Type of the options object passed to the validator
 * @param files - The uploaded file(s) to validate (can be a file, array, or group)
 * @param validator - The function used to validate each file. It receives the file and options.
 * @param options - Optional configuration passed to the validator for custom rules
 * @returns `true` if all files are valid, `false` otherwise
 */
export function validateFileUpload<T>(
  files: any,
  validator: (file: Express.Multer.File, options: T) => boolean,
  options: T = null,
): boolean {
  // Wrap validator with options
  const validatorWithOptions = (file: Express.Multer.File) => validator(file, options);

  // Handle validation depending on the structure
  if (isSingleFile(files)) {
    return validateSingleFile(files, validatorWithOptions);
  }

  if (isArrayOfFiles(files)) {
    return validateFileCollection(files, validatorWithOptions);
  }

  return validateFileGroups(files, validatorWithOptions);
}
