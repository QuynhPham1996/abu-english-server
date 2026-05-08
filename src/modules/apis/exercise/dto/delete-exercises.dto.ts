import { IsString } from 'class-validator';

export class DtoDeleteExercisesQuery {
  @IsString()
  ids: string;
}
