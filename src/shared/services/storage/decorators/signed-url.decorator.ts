import 'reflect-metadata';

export const SIGNED_URL_METADATA = 'SIGNED_URL_METADATA';

export interface SignedUrlOptions {
  isList?: boolean;
  targetField?: string;
}

export function SignedUrl(options: SignedUrlOptions = {}) {
  return function (target: any, propertyKey: string) {
    Reflect.defineMetadata(SIGNED_URL_METADATA, options, target, propertyKey);
  };
}
