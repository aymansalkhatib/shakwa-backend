import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { InternalRole } from '../../../../common/enums/role.enum';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';
import { ComplaintAuthority } from '../../../your-bucket-name';

export class InternalUserFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Full name must be a string' })
  @Length(1, 150, { message: 'Full name must be between 1 and 150 characters' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsEnum(InternalRole)
  role?: InternalRole;

  @IsOptional()
  @IsNotEmpty({ message: 'Authority is required' })
  @IsEnum(ComplaintAuthority)
  authority: ComplaintAuthority;
}
