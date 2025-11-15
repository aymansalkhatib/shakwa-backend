import bytes from 'bytes';
import sharp from 'sharp';
import {
  DEFAULT_COMPRESSION_OPTIONS,
  FORMAT_PRIORITIES,
  SHARP_SUPPORTED_FORMATS,
} from '../constants/file-validation';
import {
  FileSizeUnit,
  ImageCompressionOptions,
  ImageDimensions,
  ImageFormat,
} from '../types';
import { extractFileExtension } from './file-helper';

/**
 * Optimizes an image by finding the best balance between quality and file size
 */
export async function optimizeImage(
  file: Express.Multer.File,
  options: ImageCompressionOptions = {},
): Promise<Express.Multer.File> {
  const mergedOptions = { ...DEFAULT_COMPRESSION_OPTIONS, ...options };
  const { quality, minQuality, maxFileSize, outputFormat } = mergedOptions;

  try {
    const imageFormat = extractFileExtension(file.originalname);

    if (!isSupported(imageFormat)) {
      return file;
    }

    const format = outputFormat ?? (await findBestFormat(file.buffer));

    const result = await compressImageIteratively({
      buffer: file.buffer,
      format,
      initialQuality: quality,
      minQuality,
      maxSize: maxFileSize,
    });

    const originalnameParts = file.originalname.split('.');
    originalnameParts.pop(); // Removes the last item (the file extension)

    const newFilename = originalnameParts.join('.') + '.' + format; // Rebuild the filename without the extension and append the new format
    return {
      ...file,
      buffer: result.buffer,
      size: result.buffer.length,
      mimetype: `image/${format}`,
      originalname: newFilename,
    };
  } catch (error: any) {
    throw new Error(`Image optimization failed: ${error?.message}`);
  }
}

/**
 * Determines if the image format is supported by Sharp
 */
function isSupported(format: string): boolean {
  return SHARP_SUPPORTED_FORMATS.includes(format as ImageFormat);
}

/**
 * Finds the best format for compression by testing different formats
 */
async function findBestFormat(buffer: Buffer): Promise<ImageFormat> {
  const originalSize = buffer.length;
  const results = await Promise.all(
    FORMAT_PRIORITIES.map(async (format) => {
      const converted = await sharp(buffer)
        .toFormat(format, { quality: 80 })
        .toBuffer();
      return { format, size: converted.length };
    }),
  );

  const bestResult = results.reduce((best, current) =>
    current.size < best.size ? current : best,
  );

  return bestResult.size < originalSize ? bestResult.format : 'jpeg';
}

/**
 * Determines if further compression is needed
 */
function needsCompression(
  currentSize: number,
  targetSize: FileSizeUnit,
  currentQuality: number,
  minQuality: number,
): boolean {
  return currentSize > bytes(targetSize) && currentQuality > minQuality;
}

/**
 * Calculates optimal dimensions while maintaining aspect ratio
 */
async function calculateOptimalDimensions(
  buffer: Buffer,
  targetSize: FileSizeUnit,
): Promise<ImageDimensions> {
  const metadata = await sharp(buffer).metadata();
  const targetBytes = bytes(targetSize);
  const ratio = Math.sqrt(targetBytes / buffer.length);

  return {
    width: Math.round(metadata.width * ratio),
    height: Math.round(metadata.height * ratio),
  };
}

/**
 * Processes image with specific quality and format settings
 */
async function processImage(
  buffer: Buffer,
  quality: number,
  format: ImageFormat,
  dimensions?: ImageDimensions,
): Promise<Buffer> {
  const pipeline = sharp(buffer);

  if (dimensions) {
    pipeline.resize({
      ...dimensions,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  return pipeline.toFormat(format, { quality }).toBuffer();
}

/**
 * Iteratively compresses image until target size or minimum quality is reached
 */
async function compressImageIteratively({
  buffer,
  format,
  initialQuality,
  minQuality,
  maxSize,
}: {
  buffer: Buffer;
  format: ImageFormat;
  initialQuality: number;
  minQuality: number;
  maxSize: FileSizeUnit;
}): Promise<{ buffer: Buffer; quality: number }> {
  let currentBuffer = buffer;
  let currentQuality = initialQuality;
  const dimensions = await calculateOptimalDimensions(buffer, maxSize);

  while (
    needsCompression(currentBuffer.length, maxSize, currentQuality, minQuality)
  ) {
    currentBuffer = await processImage(
      buffer,
      currentQuality,
      format,
      dimensions,
    );
    currentQuality -= 5;
  }

  return { buffer: currentBuffer, quality: currentQuality };
}
