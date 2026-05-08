import { IsOptional, IsNotEmpty, IsEnum } from 'class-validator';

import { DtoPaginate } from 'src/common/dto/pagination.dto';
import { EUserRole, EUserStatus } from 'src/common/enums';

export class DtoGetUsersQuery extends DtoPaginate {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EUserStatus)
  status?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EUserRole)
  role?: string;
}
