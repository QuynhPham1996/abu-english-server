import { IsString } from 'class-validator';

export class DtoDeleteCoursesQuery {
  @IsString()
  ids: string;
}
