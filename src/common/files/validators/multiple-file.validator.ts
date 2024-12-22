import { FileValidator } from '@nestjs/common';
import { extname } from 'path';

export class MultipleFileValidator extends FileValidator {
  constructor(private fieldFileTypes: Record<string, string[]>) {
    super({});
  }

  isValid(files: any): boolean {
    console.log(files.fieldname);

    let isValid = true;

    for (const fieldName in files) {
      const fieldFiles = files[fieldName];
      const allowedExtensions = this.fieldFileTypes[fieldName];

      if (!allowedExtensions) {
        continue;
      }

      // Check each file for the field
      for (const file of fieldFiles) {
        const fileExt = extname(file.originalname).toLowerCase();

        console.log(
          '🚀  ~  file: multiple-file.validator.ts:24 ~  MultipleFileValidator ~  isValid ~  fileExt:',
          fileExt,
        );

        // If the file extension is not allowed, mark as invalid
        if (!allowedExtensions.includes(fileExt)) {
          isValid = false; // Set validity to false
          break; // No need to check further for this field
        }
      }
    }

    return isValid; // Return the overall validity
  }

  buildErrorMessage(files: any): string {
    const errorMessages: string[] = [];

    for (const fieldName in files) {
      const fieldFiles = files[fieldName];
      const allowedExtensions = this.fieldFileTypes[fieldName];

      if (fieldFiles) {
        fieldFiles.forEach((file: Express.Multer.File) => {
          const fileExt = extname(file.originalname).toLowerCase();

          if (!allowedExtensions.includes(fileExt)) {
            errorMessages.push(
              `Invalid file type for field "${fieldName}". Allowed extensions: ${allowedExtensions.join(', ')}. Received: ${fileExt}.`,
            );
          }
        });
      }
    }

    return errorMessages.length > 0
      ? errorMessages.join(' ')
      : 'File validation error.';
  }
}
