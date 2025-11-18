import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, Min, ValidationOptions } from 'class-validator';

export function PositiveIntegerId({
  nullable = false,
}: { nullable?: boolean; message?: ValidationOptions['message'] } = {}) {
  return applyDecorators(
    Transform(({ obj, key }) => {
      const value = obj[key];
      if (value === null || value === undefined || value === '' || value === 'null') {
        return nullable ? null : undefined;
      }
      const num = Number(value);
      return isNaN(num) ? undefined : num;
    }),
    IsNotEmpty(),
    IsInt({ message: TranslateHelper.trValMsg('pipes.validation.id_integer') }),
    Min(1, { message: TranslateHelper.trValMsg('pipes.validation.id_positive') }),
  );
}
