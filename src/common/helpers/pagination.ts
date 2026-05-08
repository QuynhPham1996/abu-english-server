import { BadRequestException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';

import {
  DtoPaginate,
  DtoPaginateResponse,
} from 'src/common/dto/pagination.dto';

export async function commonPagination<T>(
  dtoPagination: DtoPaginate,
  query: SelectQueryBuilder<T>,
): Promise<DtoPaginateResponse<T>> {
  const page = Number(dtoPagination.page) - 1;
  const pageSize = Number(dtoPagination.pageSize);

  if (page < 0 || pageSize < 1) {
    throw new BadRequestException();
  }

  const [result, total] = await query
    .skip(page * pageSize)
    .take(pageSize)
    .getManyAndCount();

  return {
    data: result,
    paginate: {
      page: page + 1,
      pageSize,
      total,
    },
  };
}
