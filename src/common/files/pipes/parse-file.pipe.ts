import {
  FileValidator,
  HttpStatus,
  ParseFilePipe,
  UnprocessableEntityException,
} from '@nestjs/common';
import { FileSignatureValidator } from '../validators/file-signature.validator';
import {
  FileParsingPipeOptions,
  NonEmptyArray,
  SupportedFileType,
} from '../types/file.types';
import { FileNotEmptyValidator } from '../validators/file-not-empty.validator';
import { CustomSizeLimitValidator } from '../validators/custom-size-limit.validator';
import { sizeLimits as sl } from '../constants/file.constants';
import { MaxFileSizeValidator } from '../validators/max-file-size.validator';
import { FileNameValidator } from '../validators/file-name.validator';

export class CustomFileParsingPipe extends ParseFilePipe {
  constructor(options: FileParsingPipeOptions = {}) {
    const {
      maxSize = '5MB',
      supportedFileTypes = [
        'png',
        'jpg',
        'jpeg',
      ] as NonEmptyArray<SupportedFileType>,
      fileIsRequired = true,
      sizeLimits = sl,
    } = options;

    const validators: FileValidator[] = [
      new MaxFileSizeValidator({ maxSize }),
      new FileSignatureValidator(supportedFileTypes, true),
      new FileNotEmptyValidator(),
      new FileNameValidator(),
      new CustomSizeLimitValidator({ sizeLimits }),
    ];

    super({
      validators,
      errorHttpStatusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      fileIsRequired,
      exceptionFactory: (error: string) => {
        throw new UnprocessableEntityException(error);
      },
    });
  }
}
