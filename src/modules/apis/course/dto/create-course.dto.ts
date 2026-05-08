import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ECourseLevel, ECourseStatus } from 'src/common/enums';

export class DtoCreateCourseBody {
  @IsOptional()
  @IsString()
  image?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(10000)
  retailPrice?: number;

  @IsNumber()
  @Min(10000)
  sellingPrice: number;

  @IsOptional()
  @IsEnum(ECourseStatus)
  status?: ECourseStatus;

  @IsOptional()
  @IsEnum(ECourseLevel)
  level?: ECourseLevel;

  @IsUUID()
  manager: string;
}
