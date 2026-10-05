import { IsUUID } from 'class-validator';

export class DtoAddLessonGroupBody {
  @IsUUID()
  groupId: string;
}
