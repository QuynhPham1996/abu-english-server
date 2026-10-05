import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EQuestionGroupStatus } from 'src/common/enums';

export class DtoUpdateQuestionGroupBody {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(EQuestionGroupStatus)
  status?: EQuestionGroupStatus;
}
