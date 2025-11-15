import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class CitizenResponseDto {
  @Expose()
  id: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;
}
