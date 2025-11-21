import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { SIGNED_URL_METADATA, SignedUrlOptions } from '../decorators/signed-url.decorator';
import { StorageService } from '../storage.service';

@Injectable()
export class SignedUrlInterceptor implements NestInterceptor {
  constructor(private readonly storageService: StorageService) {}

  intercept(_: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      mergeMap(async (data) => {
        if (!data) return data;
        return this.transformData(data);
      }),
    );
  }

  private async transformData(data: any): Promise<any> {
    // Collect all paths that need signing
    const pathsToSign: { path: string; callback: (url: string) => void }[] = [];

    this.scanForPaths(data, pathsToSign);

    if (pathsToSign.length === 0) {
      return data;
    }

    // Fetch all URLs in parallel/batch
    const uniquePaths = [...new Set(pathsToSign.map((p) => p.path))];
    const urls = await this.storageService.getUrls(uniquePaths);

    // Create a map for quick lookup
    const urlMap = new Map<string, string>();
    uniquePaths.forEach((path, index) => {
      urlMap.set(path, urls[index]);
    });

    // Apply URLs
    pathsToSign.forEach((item) => {
      const url = urlMap.get(item.path);
      if (url) {
        item.callback(url);
      }
    });

    return data;
  }

  private scanForPaths(
    data: any,
    pathsToSign: { path: string; callback: (url: string) => void }[],
  ) {
    if (!data || typeof data !== 'object') {
      return;
    }

    if (Array.isArray(data)) {
      data.forEach((item) => this.scanForPaths(item, pathsToSign));
      return;
    }

    // Check properties of the object
    for (const key of Object.keys(data)) {
      const value = data[key];
      const metadata: SignedUrlOptions = Reflect.getMetadata(SIGNED_URL_METADATA, data, key);

      if (metadata) {
        if (metadata.isList && Array.isArray(value)) {
          // Initialize target field if needed
          if (metadata.targetField) {
            data[metadata.targetField] = new Array(value.length);
          }

          value.forEach((path, index) => {
            if (typeof path === 'string') {
              pathsToSign.push({
                path,
                callback: (url) => {
                  if (metadata.targetField) {
                    data[metadata.targetField][index] = url;
                  } else {
                    value[index] = url;
                  }
                },
              });
            }
          });
        } else if (!metadata.isList && typeof value === 'string') {
          pathsToSign.push({
            path: value,
            callback: (url) => {
              if (metadata.targetField) {
                data[metadata.targetField] = url;
              } else {
                data[key] = url;
              }
            },
          });
        }
      } else {
        // Recursively scan nested objects
        this.scanForPaths(value, pathsToSign);
      }
    }
  }
}
