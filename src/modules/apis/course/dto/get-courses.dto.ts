import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { DtoPaginate } from 'src/common/dto/pagination.dto';
import { ECourseLevel, ECourseStatus } from 'src/common/enums';

export class DtoGetCoursesQuery extends DtoPaginate {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ECourseStatus)
  status?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ECourseLevel)
  level?: string;
}
