import { IsString } from 'class-validator';

export class DtoDeleteQuestionGroupsQuery {
  @IsString()
  ids: string;
}
