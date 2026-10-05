import { IsObject } from 'class-validator';

export class DtoUpdateAssignmentQuestionsIndexBody {
  @IsObject()
  newIndex: { [key: string]: number };
}
