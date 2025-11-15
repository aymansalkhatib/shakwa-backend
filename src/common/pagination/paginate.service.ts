import {
  ClassConstructor,
  ClassTransformOptions,
  plainToInstance,
} from 'class-transformer';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginationResponseDto } from './dto/pagination-response.dto';
import { PaginationDto } from './dto/pagination.dto';

export async function paginate<
  Entity extends ObjectLiteral,
  ResponseDto = Entity,
>(
  queryBuilder: SelectQueryBuilder<Entity>,
  paginationDto: PaginationDto,
  responseClass: ClassConstructor<ResponseDto>,
  converter?: (items: Entity) => ResponseDto,
  transformOptions?: ClassTransformOptions,
): Promise<PaginationResponseDto<ResponseDto>> {
  const page = Math.max(paginationDto.page || 1, 1);
  const limit = Math.min(Math.max(paginationDto.limit || 10, 1), 100);
  const skip = (page - 1) * limit;

  let [data, total] = await queryBuilder
    .skip(skip)
    .take(limit)
    .getManyAndCount();

  if (converter) {
    data = data.map(converter) as any;
  }

  const transformedData = plainToInstance(responseClass, data, {
    excludeExtraneousValues: true,
    ...transformOptions,
  });

  return new PaginationResponseDto<ResponseDto>(
    transformedData,
    total,
    page,
    limit,
  );
}
