import { Injectable, PipeTransform } from '@nestjs/common';
import { Express } from 'express';
import { isArrayOfFiles, isSingleFile } from '../utils/filter-type-file.utils';
import { compressImageFile } from '../functions/compress-image-file';

@Injectable()
export class ImageProcessingPipe implements PipeTransform {
  async transform(files: any) {
    if (isSingleFile(files)) {
      files = await compressImageFile(files);
    } else if (isArrayOfFiles(files)) {
      files = await Promise.all(
        files.map(async (file: Express.Multer.File) => {
          return await compressImageFile(file);
        }),
      );
    } else {
      for (const key in files) {
        if (Object.prototype.hasOwnProperty.call(files, key)) {
          const filesArray = files[key];
          if (Array.isArray(filesArray)) {
            for (let i = 0; i < filesArray.length; i++) {
              const file = filesArray[i];

              filesArray[i] = await compressImageFile(file);
            }
          }
        }
      }
    }

    return files;
  }
}
