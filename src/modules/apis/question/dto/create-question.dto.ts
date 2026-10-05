import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

import { ELessonType } from 'src/common/enums';

export class DtoAnswerEntity {
  @IsUUID()
  id: string;

  @IsString()
  title: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class DtoCreateQuestionBody {
  @IsString()
  question: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => DtoAnswerEntity)
  answers?: DtoAnswerEntity[];

  @IsOptional()
  @IsUUID()
  lesson?: string;

  @IsOptional()
  @IsUUID()
  assignment?: string;

  @IsOptional()
  @IsEnum(ELessonType)
  type?: ELessonType;

  @IsOptional()
  @IsString()
  note?: string;
}
