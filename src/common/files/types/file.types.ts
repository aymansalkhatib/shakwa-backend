export type SupportedFileType =
  | 'png'
  | 'jpg'
  | 'jpeg' // this type image is  supported
  | 'pdf'
  | 'mp4'
  | 'ogg'
  | 'txt';

export type FileSizeUnit = `${number}${'KB' | 'MB' | 'GB' | 'TB'}`;

export type NonEmptyArray<T> = [T, ...T[]];

export type FileParsingPipeOptions = {
  maxSize?: FileSizeUnit;
  supportedFileTypes?: NonEmptyArray<SupportedFileType>;
  fileIsRequired?: boolean;
  sizeLimits?: Record<SupportedFileType, FileSizeUnit>;
};
