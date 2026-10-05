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

export class DtoQuestionBankChildBody {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  question: string;

  @IsEnum(ELessonType)
  type: ELessonType;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DtoAnswerEntity)
  answers?: DtoAnswerEntity[];

  @IsOptional()
  @IsString()
  note?: string;
}

export class DtoCreateQuestionBankBody {
  @IsString()
  question: string;

  @IsEnum(ELessonType)
  type: ELessonType;

  @IsUUID()
  group: string;

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
