import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { EUserStatus } from 'src/common/enums';

export class DtoUpdateUserBody {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  avatar?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(64)
  email?: string;

  @IsOptional()
  @IsNumberString()
  @IsNotEmpty()
  phoneNumber?: string;

  @IsOptional()
  @IsEnum(EUserStatus)
  status?: EUserStatus;
}
