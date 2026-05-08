import { IsString } from 'class-validator';

export class DtoDeleteLessonsQuery {
  @IsString()
  ids: string;
}
