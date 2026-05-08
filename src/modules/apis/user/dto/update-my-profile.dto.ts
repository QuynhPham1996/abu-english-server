import {
  IsEmail,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class DtoUpdateMyProfileBody {
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
}
