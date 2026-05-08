import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { EExerciseStatus } from 'src/common/enums';

export class DtoCreateExerciseBody {
  @IsString()
  name: string;

  @IsUUID()
  course: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EExerciseStatus)
  status?: EExerciseStatus;
}
