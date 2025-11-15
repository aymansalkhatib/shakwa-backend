import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, Min } from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

export function PositiveIntegerIdArray({ nullable = false }: { nullable?: boolean } = {}) {
  return applyDecorators(
    Transform(({ obj, key }) => {
      const value = obj[key];
      if (value === null || value === undefined || value === '' || value === 'null') {
        return nullable ? null : undefined;
      }

      // Handle string input (comma-separated values)
      if (typeof value === 'string') {
        return value
          .split(',')
          .map((v) => {
            const num = Number(v.trim());
            return isNaN(num) ? undefined : num;
          })
          .filter((v) => v !== undefined);
      }

      // Handle array input
      if (Array.isArray(value)) {
        return value
          .map((v) => {
            const num = Number(v);
            return isNaN(num) ? undefined : num;
          })
          .filter((v) => v !== undefined);
      }

      return undefined;
    }),
    IsArray({ message: TranslateHelper.trValMsg('pipes.validation.array_required') }),
    IsNotEmpty({ each: true, message: TranslateHelper.trValMsg('pipes.validation.id_not_empty') }),
    IsInt({ each: true, message: TranslateHelper.trValMsg('pipes.validation.id_integer') }),
    Min(1, {
      each: true,
      message: TranslateHelper.trValMsg('pipes.validation.id_positive'),
    }),
  );
}
