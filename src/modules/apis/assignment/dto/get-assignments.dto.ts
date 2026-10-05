import { IsEnum, IsNotEmpty, IsOptional } from 'class-validator';
import { DtoPaginate } from 'src/common/dto/pagination.dto';
import {
  EAssignmentStatus,
  ELessonType,
} from 'src/common/enums';

export class DtoGetAssignmentsQuery extends DtoPaginate {
  @IsOptional()
  @IsNotEmpty()
  @IsEnum(EAssignmentStatus)
  status?: EAssignmentStatus;

  @IsOptional()
  @IsNotEmpty()
  @IsEnum(ELessonType)
  type?: ELessonType;
}
