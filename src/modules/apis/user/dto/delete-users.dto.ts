import { IsString } from 'class-validator';

export class DtoDeleteUsersQuery {
  @IsString()
  ids: string;
}
