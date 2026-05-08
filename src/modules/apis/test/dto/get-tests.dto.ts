import { IsEnum, IsOptional } from 'class-validator';
import { DtoPaginate } from 'src/common/dto/pagination.dto';
import { ELessonType, ETestStatus } from 'src/common/enums';

export class DtoGetTestsQuery extends DtoPaginate {
  @IsOptional()
  @IsEnum(ETestStatus)
  status?: ETestStatus;

  @IsOptional()
  @IsEnum(ELessonType)
  type?: ELessonType;
}
