import { ArrayMinSize, IsArray, IsUUID } from 'class-validator';

export class DtoAttachAssignmentsBody {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  assignmentIds: string[];
}
