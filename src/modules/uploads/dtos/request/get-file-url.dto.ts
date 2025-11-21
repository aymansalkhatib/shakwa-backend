import { IsNotEmpty, IsString } from 'class-validator';

export class GetFileUrlDto {
  @IsString()
  @IsNotEmpty()
  path: string;
}
