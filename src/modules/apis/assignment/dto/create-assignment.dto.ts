import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  EAssignmentStatus,
  ELessonArrange,
  ELessonType,
} from 'src/common/enums';

export class DtoCreateAssignmentBody {
  @IsString()
  name: string;

  @IsEnum(ELessonType)
  type: ELessonType;

  @IsEnum(ELessonArrange)
  arrange: ELessonArrange;

  @IsOptional()
  @IsEnum(EAssignmentStatus)
  status?: EAssignmentStatus;
}
