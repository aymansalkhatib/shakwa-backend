import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { TranslateHelper } from '../../shared/modules/app-i18n/translate.helper';

@ValidatorConstraint({ name: 'ValidateMinMaxPairs', async: false })
export class ValidateMinMaxPairsConstraint implements ValidatorConstraintInterface {
  private validationErrors: Array<{ field: string; message: string }> = [];

  validate(value: any, args: ValidationArguments): boolean {
    const object = args.object as any;
    this.validationErrors = [];

    // Get all property names from the object
    const propertyNames = Object.keys(object);

    // Find all min/max pairs
    const minMaxPairs = this.findMinMaxPairs(propertyNames);

    // Validate each pair
    for (const pair of minMaxPairs) {
      const minValue = object[pair.minField];
      const maxValue = object[pair.maxField];

      // Only validate if both values are numbers
      if (typeof minValue === 'number' && typeof maxValue === 'number') {
        if (maxValue < minValue) {
          const fieldDisplayName = this.getFieldDisplayName(pair.maxField);
          const minFieldDisplayName = this.getFieldDisplayName(pair.minField);

          this.validationErrors.push({
            field: pair.maxField,
            message: TranslateHelper.trValMsg('pipes.validation.max_greater_than_or_equal_min', {
              maxField: fieldDisplayName,
              maxValue,
              minField: minFieldDisplayName,
              minValue,
            })(args),
          });
        }
      }
    }

    return this.validationErrors.length === 0;
  }

  defaultMessage(args: ValidationArguments): string {
    if (this.validationErrors.length === 0) {
      return 'Min/Max validation failed';
    }

    // If only one error, return it directly
    if (this.validationErrors.length === 1) {
      return this.validationErrors[0].message;
    }

    // Multiple errors - create a detailed message
    const errorMessages = this.validationErrors.map((error) => error.message);
    return `Multiple validation errors: ${errorMessages.join('; ')}`;
  }

  private getFieldDisplayName(fieldName: string): string {
    let displayName = fieldName;

    // Handle min/max prefixes
    if (fieldName.startsWith('min')) {
      displayName = 'Minimum' + fieldName.substring(3);
    } else if (fieldName.startsWith('max')) {
      displayName = 'Maximum' + fieldName.substring(3);
    }

    // Convert camelCase to space-separated words
    displayName = displayName.replace(/([A-Z])/g, ' $1').trim();

    // Capitalize first letter of each word
    displayName = displayName.replace(/\b\w/g, (letter) => letter.toUpperCase());

    return displayName;
  }

  private findMinMaxPairs(
    propertyNames: string[],
  ): Array<{ minField: string; maxField: string; baseName: string }> {
    const pairs: Array<{ minField: string; maxField: string; baseName: string }> = [];

    // Find all properties that start with 'min'
    const minFields = propertyNames.filter((name) => name.startsWith('min'));

    for (const minField of minFields) {
      // Extract the base name (e.g., 'minValue' -> 'Value', 'minAmount' -> 'Amount')
      const baseName = minField.substring(3); // Remove 'min' prefix
      const maxField = 'max' + baseName;

      // Check if corresponding max field exists
      if (propertyNames.includes(maxField)) {
        pairs.push({
          minField,
          maxField,
          baseName,
        });
      }
    }

    return pairs;
  }
}

export function ValidateMinMaxPairs(validationOptions?: ValidationOptions) {
  return function (constructor: Function) {
    registerDecorator({
      name: 'ValidateMinMaxPairs',
      target: constructor,
      propertyName: undefined,
      options: validationOptions,
      validator: ValidateMinMaxPairsConstraint,
    });
  };
}
