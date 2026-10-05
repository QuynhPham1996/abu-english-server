import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ELessonArrange, ELessonStatus, ELessonType } from 'src/common/enums';

export class DtoCreateLessonBody {
  @IsString()
  name: string;

  @IsEnum(ELessonType)
  type: ELessonType;

  @IsOptional()
  @IsUUID()
  exercise?: string;

  @IsOptional()
  @IsUUID()
  course?: string;

  @IsEnum(ELessonArrange)
  arrange: ELessonArrange;

  @IsOptional()
  @IsEnum(ELessonStatus)
  status?: ELessonStatus;
}
