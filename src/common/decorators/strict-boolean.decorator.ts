import { applyDecorators, BadRequestException } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean, ValidationOptions } from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

interface StrictBooleanOptions {
  default?: boolean;
  message?: ValidationOptions['message'];
}

export function StrictBoolean(options?: StrictBooleanOptions) {
  return applyDecorators(
    Transform(({ key, obj }) => {
      const value = obj[key];

      if (value === undefined || value === null || value === '') {
        return options?.default !== undefined ? options.default : undefined;
      }

      if (value === true || value === false) return value;
      if (value === 1 || value === '1' || value === 'true') return true;
      if (value === 0 || value === '0' || value === 'false') return false;

      return new BadRequestException(
        options?.message ||
          TranslateHelper.trValMsg('pipes.validation.invalid_boolean_value', {
            key,
          }),
      );
    }),
    IsBoolean(),
  );
}
