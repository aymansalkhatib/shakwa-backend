import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { IPaginatedResponse } from './interfaces/paginated-response.interface';
import { IPaginationOptions } from './interfaces/pagination-options.interface';

/**
 * Paginates a query builder and returns paginated results
 * @param queryBuilder - TypeORM query builder
 * @param options - Pagination options (page, limit)
 * @returns Paginated response with data and pagination metadata
 */
export async function paginate<Entity extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<Entity>,
  options: IPaginationOptions,
): Promise<IPaginatedResponse<Entity>> {
  const page = Math.max(options.page || 1, 1);
  const limit = Math.min(Math.max(options.limit || 10, 1), 100);
  const skip = (page - 1) * limit;

  const [data, total] = await queryBuilder.skip(skip).take(limit).getManyAndCount();

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      nextPage: page < totalPages ? page + 1 : null,
      prevPage: page > 1 ? page - 1 : null,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
