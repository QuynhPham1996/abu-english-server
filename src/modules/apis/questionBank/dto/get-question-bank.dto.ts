import { IsEnum, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { DtoPaginate } from 'src/common/dto/pagination.dto';
import { ELessonType } from 'src/common/enums';

export class DtoGetQuestionBankQuery extends DtoPaginate {
  @IsOptional()
  @IsUUID()
  groupId?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ELessonType)
  type?: ELessonType;
}
