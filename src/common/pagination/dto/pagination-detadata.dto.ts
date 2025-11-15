import { Expose } from 'class-transformer';

export class PaginationMetadataDto {
  @Expose()
  total: number;

  @Expose()
  currentPage: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;

  @Expose()
  nextPage: number | null;

  @Expose()
  prevPage: number | null;

  @Expose()
  hasNextPage: boolean;

  @Expose()
  hasPrevPage: boolean;
}
