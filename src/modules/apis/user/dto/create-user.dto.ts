import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { EUserRole, EUserStatus } from 'src/common/enums';

export class DtoCreateUserBody {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsString()
  @MaxLength(64)
  username: string;

  @IsString()
  @MinLength(8)
  @MaxLength(64)
  password: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(64)
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsString()
  @MaxLength(128)
  name: string;

  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;

  @IsOptional()
  @IsEnum([EUserRole.MANAGER, EUserRole.STUDENT])
  role?: EUserRole;
}
