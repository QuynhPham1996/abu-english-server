import { IsString } from 'class-validator';

export class DtoDeleteQuestionsQuery {
  @IsString()
  ids: string;
}
