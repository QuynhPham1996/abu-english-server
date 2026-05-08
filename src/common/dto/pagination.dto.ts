import {
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class DtoPaginate {
  @IsNumberString()
  @IsNotEmpty()
  page: string;

  @IsNumberString()
  @IsNotEmpty()
  @MaxLength(3)
  pageSize: string;

  @IsOptional()
  @IsNotEmpty()
  sort?: string;

  @IsOptional()
  @IsNotEmpty()
  search?: string;
}

export class DtoPaginateResponse<T> {
  [key: string]: any;
  data: T[];
  paginate: {
    page?: number;
    pageSize?: number;
    total: number;
  };
}
