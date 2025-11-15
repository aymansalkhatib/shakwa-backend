/**
 * Interface for paginated response
 * Used by repository and service layers
 */
export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    nextPage: number | null;
    prevPage: number | null;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
