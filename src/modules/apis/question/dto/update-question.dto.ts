import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { DtoAnswerEntity } from 'src/modules/apis/question/dto/create-question.dto';

export class DtoUpdateQuestionBody {
  @IsOptional()
  @IsString()
  question?: string;

  @IsOptional()
  @IsBoolean()
  isCorrect?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => DtoAnswerEntity)
  answers?: DtoAnswerEntity[];

  @IsOptional()
  @IsString()
  note?: string;
}
