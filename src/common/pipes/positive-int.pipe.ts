import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

@Injectable()
export class PositiveIntPipe implements PipeTransform<string, number> {
  constructor(private readonly translateHelper: TranslateHelper) {}

  transform(value: string): number {
    const val = parseInt(value, 10);
    if (isNaN(val) || val <= 0) {
      throw new BadRequestException(
        this.translateHelper.tr('pipes.validation.positive_integer_required'),
      );
    }
    return val;
  }
}
