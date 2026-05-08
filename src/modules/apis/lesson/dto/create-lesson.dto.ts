import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ELessonArrange, ELessonStatus, ELessonType } from 'src/common/enums';

export class DtoCreateLessonBody {
  @IsString()
  name: string;

  @IsEnum(ELessonType)
  type: ELessonType;

  @IsUUID()
  exercise: string;

  @IsEnum(ELessonArrange)
  arrange: ELessonArrange;

  @IsOptional()
  @IsEnum(ELessonStatus)
  status?: ELessonStatus;
}
