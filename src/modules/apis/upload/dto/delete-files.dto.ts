import { IsString } from 'class-validator';

export class DtoDeleteFilesQuery {
  @IsString()
  paths: string;
}
