import { IsUUID } from 'class-validator';

export class DtoCreateUserLessonBody {
  @IsUUID()
  user: string;

  @IsUUID()
  lesson: string;
}
