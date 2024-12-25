import * as bytes from 'bytes';
import { FileSizeUnit } from '../types/file.types';
import * as sharp from 'sharp';
import { formatsSharp } from '../constants/file.constants';

export async function compressImageFile(
  file: Express.Multer.File,
  {
    quality = 80,
    minQuality = 50,
    maxFileSizeKB = '200KB',
    outputFormat,
  }: {
    maxSize?: FileSizeUnit;
    quality?: number;
    minQuality?: number;
    maxFileSizeKB?: FileSizeUnit;
    outputFormat?: keyof sharp.FormatEnum;
  } = {},
): Promise<Express.Multer.File> {
  try {
    const mimeType = file.originalname.split('.').pop();

    if (!formatsSharp.includes(mimeType)) {
      return file;
    }

    let processedBuffer = await sharp(file.buffer).toBuffer();
    let adjustedQuality = quality;

    while (
      shouldCompress(
        processedBuffer.length,
        maxFileSizeKB,
        adjustedQuality,
        minQuality,
      )
    ) {
      processedBuffer = await processImage(
        file.buffer,
        adjustedQuality,
        outputFormat ?? (mimeType as keyof sharp.FormatEnum),
      );

      adjustedQuality -= 5;
    }

    file.buffer = processedBuffer;
    file.size = processedBuffer.length;

    return file;
  } catch (error) {
    throw new Error('Error processing image: ' + error.message);
  }
}

// Helper function to check if compression is needed
function shouldCompress(
  currentSize: number,
  maxSizeKB: FileSizeUnit,
  quality: number,
  minQuality: number,
): boolean {
  return currentSize > bytes(maxSizeKB) && quality > minQuality;
}

// Helper function to process the image
async function processImage(
  buffer: Buffer,
  quality: number,
  outputFormat: keyof sharp.FormatEnum,
): Promise<Buffer> {
  const { width, height } = await sharp(buffer).metadata();

  // Determine new dimensions based on conditions
  const newWidth = width * (quality / 100);
  const newHeight = height * (quality / 100);

  // Determine the original format from the mimetype and use it if outputFormat is not provided

  return sharp(buffer)
    .resize({
      width: newWidth,
      height: newHeight,
      fit: sharp.fit.inside,
      withoutEnlargement: true,
    })
    .toFormat(outputFormat, { quality: quality }) // Use specified output format
    .toBuffer();
}
