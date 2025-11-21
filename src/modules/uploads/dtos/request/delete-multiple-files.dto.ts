import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class DeleteMultipleFilesDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  paths: string[];
}
