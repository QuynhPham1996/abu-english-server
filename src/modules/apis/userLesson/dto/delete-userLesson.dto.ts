import { IsString } from 'class-validator';

export class DtoDeleteUserLessonsQuery {
  @IsString()
  ids: string;
}
