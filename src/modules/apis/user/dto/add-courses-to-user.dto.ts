import { IsArray, IsString } from 'class-validator';

export class DtoAddCoursesToUserBody {
  @IsArray()
  @IsString({ each: true })
  courses: string[];
}
