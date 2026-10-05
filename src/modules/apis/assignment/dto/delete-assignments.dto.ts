import { IsString } from 'class-validator';

export class DtoDeleteAssignmentsQuery {
  @IsString()
  ids: string;
}
