import { IsUUID } from 'class-validator';

export class DtoCreateUserExerciseBody {
  @IsUUID()
  user: string;

  @IsUUID()
  exercise: string;
}
