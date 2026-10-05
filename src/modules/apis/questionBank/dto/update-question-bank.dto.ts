import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ELessonType } from 'src/common/enums';
import { DtoAnswerEntity } from 'src/modules/apis/question/dto/create-question.dto';
import { DtoQuestionBankChildBody } from 'src/modules/apis/questionBank/dto/create-question-bank.dto';

export class DtoUpdateQuestionBankBody {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsEnum(ELessonType)
  type?: ELessonType;

  @IsOptional()
  @IsUUID()
  group?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => DtoAnswerEntity)
  answers?: DtoAnswerEntity[];

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DtoQuestionBankChildBody)
  children?: DtoQuestionBankChildBody[];
}
