import { IsObject } from 'class-validator';

export class DtoNewIndex {
  [key: string]: number;
}

export class DtoUpdateLessonQuestionsIndexBody {
  @IsObject()
  newIndex: { [key: string]: number };
}
