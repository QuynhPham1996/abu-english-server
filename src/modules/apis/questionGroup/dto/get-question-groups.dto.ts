import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { DtoPaginate } from 'src/common/dto/pagination.dto';
import { ELessonType, EQuestionGroupStatus } from 'src/common/enums';

export class DtoGetQuestionGroupsQuery extends DtoPaginate {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EQuestionGroupStatus)
  status?: EQuestionGroupStatus;

  @IsOptional()
  @IsEnum(ELessonType)
  type?: ELessonType;
}
