import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EExerciseStatus } from 'src/common/enums';

export class DtoUpdateExerciseBody {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EExerciseStatus)
  status?: EExerciseStatus;
}
