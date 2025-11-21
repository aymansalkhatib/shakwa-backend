import { IsArray, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class GetFileUrlsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  paths: string[];
}
