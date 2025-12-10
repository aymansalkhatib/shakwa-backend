import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ComplaintAuthority, ComplaintCategory } from '../../../enums';

export class CreateComplaintDto {
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MaxLength(200)
  title: string;

  @IsNotEmpty({ message: 'Description is required' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'Category is required' })
  @IsEnum(ComplaintCategory)
  category: ComplaintCategory;

  @IsNotEmpty({ message: 'Authority is required' })
  @IsEnum(ComplaintAuthority)
  authority: ComplaintAuthority;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @IsOptional()
  @IsArray()
  attachments?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(2048)
  citizenNote?: string;
}
