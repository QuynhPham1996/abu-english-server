import { IsString } from 'class-validator';

export class DtoDeleteUserExercisesQuery {
  @IsString()
  ids: string;
}
