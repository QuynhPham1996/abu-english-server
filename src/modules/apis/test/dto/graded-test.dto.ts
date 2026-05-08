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
import { TUserAnswer } from 'src/common/types';

export class DtoUserAnswer {
  @IsUUID()
  question: string;

  @IsString()
  @IsOptional()
  answer?: string;

  @IsBoolean()
  isCorrect: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class DtoGradedTestBody {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DtoUserAnswer)
  userAnswers: TUserAnswer[];
}
