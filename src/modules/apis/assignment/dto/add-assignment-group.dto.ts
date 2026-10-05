import { IsUUID } from 'class-validator';

export class DtoAddAssignmentGroupBody {
  @IsUUID()
  groupId: string;
}
