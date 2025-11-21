import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class DeleteFileDto {
  @IsString()
  @IsNotEmpty()
  path: string;
}

export class DeleteMultipleFilesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  paths: string[];
}
