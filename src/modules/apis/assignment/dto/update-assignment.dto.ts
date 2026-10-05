import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EAssignmentStatus, ELessonArrange } from 'src/common/enums';

export class DtoUpdateAssignmentBody {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ELessonArrange)
  arrange?: ELessonArrange;

  @IsOptional()
  @IsEnum(EAssignmentStatus)
  status?: EAssignmentStatus;
}
