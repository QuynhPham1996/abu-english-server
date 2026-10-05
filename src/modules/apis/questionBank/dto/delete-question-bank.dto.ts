import { IsString } from 'class-validator';

export class DtoDeleteQuestionBankQuery {
  @IsString()
  ids: string;
}
