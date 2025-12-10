export class CaseConverterUtils {
  static toCamelCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((v) => CaseConverterUtils.toCamelCase(v));
    }

    if (obj instanceof Date) {
      return obj;
    }

    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/gi, ($1) => {
        return $1.toUpperCase().replace('-', '').replace('_', '');
      });
      result[camelKey] = CaseConverterUtils.toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }

  static toSnakeCase(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map((v) => CaseConverterUtils.toSnakeCase(v));
    }

    if (obj instanceof Date) {
      return obj;
    }

    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      result[snakeKey] = CaseConverterUtils.toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
}
