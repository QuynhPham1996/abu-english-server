import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ECourseLevel, ECourseStatus } from 'src/common/enums';

export class DtoUpdateCourseBody {
  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(10000)
  retailPrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(10000)
  sellingPrice?: number;

  @IsOptional()
  @IsEnum(ECourseStatus)
  status?: ECourseStatus;

  @IsOptional()
  @IsEnum(ECourseLevel)
  level?: ECourseLevel;

  @IsOptional()
  @IsUUID()
  manager?: string;
}
