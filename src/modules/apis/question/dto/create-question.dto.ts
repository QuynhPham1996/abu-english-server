import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

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

  @IsUUID()
  lesson: string;

  @IsOptional()
  @IsString()
  note?: string;
}
