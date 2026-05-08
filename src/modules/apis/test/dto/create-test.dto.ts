import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
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
}

export class DtoCreateTestBody {
  @IsUUID()
  lesson: string;

  @IsUUID()
  userLesson: string;

  @IsUUID()
  userExercise: string;

  @IsNumber()
  duration: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DtoUserAnswer)
  userAnswers: TUserAnswer[];
}
