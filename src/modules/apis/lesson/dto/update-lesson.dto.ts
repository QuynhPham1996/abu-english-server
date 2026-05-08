import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ELessonArrange, ELessonStatus } from 'src/common/enums';

export class DtoUpdateLessonBody {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsEnum(ELessonArrange)
  arrange: ELessonArrange;

  @IsOptional()
  @IsEnum(ELessonStatus)
  status?: ELessonStatus;
}
