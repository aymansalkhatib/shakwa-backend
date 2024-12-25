import { FileSizeUnit, NonEmptyArray, SupportedFileType } from '../types/file.types';

export const sizeLimits = {
  png: '5MB',
  jpg: '5MB',
  jpeg: '5MB',
  pdf: '5MB',
  mp4: '300MB',
  ogg: '5MB',
  txt: '100KB',
} as const satisfies Record<SupportedFileType, FileSizeUnit>;

export const arrayImagesType: NonEmptyArray<SupportedFileType> = [
  'png',
  'jpg',
  'jpeg',
];

export const fieldType: Record<string, NonEmptyArray<SupportedFileType>> = {
  image: ['png', 'jpg', 'jpeg'],
  images: ['png', 'jpg', 'jpeg'],
  videos: ['mp4'],
  audios: ['ogg'],
  file: ['txt'],
};

export const formatsSharp: string[] = [
  'avif',
  'dz',
  'fits',
  'gif',
  'heif',
  'input',
  'jpeg',
  'jpg',
  'jp2',
  'jxl',
  'magick',
  'openslide',
  'pdf',
  'png',
  'ppm',
  'raw',
  'svg',
  'tiff',
  'tif',
  'v',
  'webp',
];
