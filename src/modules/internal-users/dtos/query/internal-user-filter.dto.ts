import { IsEmail, IsEnum, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/dto/pagination-query.dto';
import { InternalRole } from '../../../../common/enums/role.enum';

export class InternalUserFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString({ message: 'Full name must be a string' })
  @Length(1, 150, { message: 'Full name must be between 1 and 150 characters' })
  fullName?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email?: string;

  @IsOptional()
  @IsEnum(InternalRole, { message: 'Role must be a valid InternalRole' })
  role?: InternalRole;
}

